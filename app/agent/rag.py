from google import genai
from sqlalchemy import select
from app.core.db import AsyncSessionLocal
from app.models.product import Product
from app.config import settings
from app.agent.prompts import SYSTEM_PROMPT

client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def retrieve_relevant_products(query: str, session, shop_id, top_k=2):
    try:
        response = client.models.embed_content(
            model="gemini-embedding-2",
            contents=query,
        )
        query_embedding = response.embeddings[0].values
        
        from app.models.shop import Shop
        # Look up the shop's owner to get the seller_id
        shop_stmt = select(Shop).where(Shop.id == shop_id)
        shop_res = await session.execute(shop_stmt)
        shop = shop_res.scalar_one_or_none()
        
        if not shop:
            return []
            
        stmt = select(Product).where(Product.seller_id == shop.owner_id).order_by(Product.embedding.cosine_distance(query_embedding)).limit(top_k)
        result = await session.execute(stmt)
        return result.scalars().all()
    except Exception as e:
        print(f"Embedding error: {e}")
        return []

from google.genai import types

async def run_agent(sender_id: str, shop_id, message_text: str, memory: list[str]) -> str:
    async with AsyncSessionLocal() as session:
        products = await retrieve_relevant_products(message_text, session, shop_id)
        
        context = "Relevant Products:\n"
        for p in products:
            context += f"- {p.name_kh} (SKU: {p.sku}): ${p.price_usd} - {p.description} (Stock: {p.stock_qty})\n"
            
        history = "\n".join(reversed(memory))
        
        prompt = f"{SYSTEM_PROMPT}\n\nShop ID: {shop_id}\n\nContext:\n{context}\n\nChat History:\n{history}\n\nUser: {message_text}\nAgent:"
        
        # Define the checkout tool
        create_order_tool = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="create_order",
                    description="Creates a new pending order and returns the Bakong KHQR checkout details. Call this when the customer confirms they want to buy a product.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "sku": types.Schema(type=types.Type.STRING, description="The exact SKU of the product to buy"),
                            "quantity": types.Schema(type=types.Type.INTEGER, description="Quantity to purchase")
                        },
                        required=["sku", "quantity"]
                    )
                )
            ]
        )
        
        try:
            # 1. Ask Gemini
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[create_order_tool]
                )
            )
            
            # 2. Check if Gemini wants to call a function
            if response.function_calls:
                fc = response.function_calls[0]
                if fc.name == "create_order":
                    sku = fc.args.get("sku")
                    qty = int(fc.args.get("quantity", 1))
                    
                    # 3. Execute DB Order Creation
                    from app.models.order import Order
                    # Mock finding user
                    user_id = 1
                    import uuid
                    
                    # Look up product price using the shop's owner_id
                    shop_stmt = select(Shop).where(Shop.id == shop_id)
                    shop_res = await session.execute(shop_stmt)
                    shop = shop_res.scalar_one_or_none()
                    
                    stmt = select(Product).where(Product.sku == sku, Product.seller_id == shop.owner_id)
                    p_res = await session.execute(stmt)
                    prod = p_res.scalar_one_or_none()
                    
                    if not prod or prod.stock_qty < qty:
                        tool_result = {"status": "failed", "reason": "Out of stock or invalid SKU."}
                    else:
                        total_usd = float(prod.price_usd) * qty
                        new_order = Order(
                            shop_id=shop_id,
                            user_id=user_id,
                            items={"sku": sku, "qty": qty},
                            total_amount_usd=total_usd,
                            khqr_string=f"khqr://bakong/{uuid.uuid4()}",
                            status="PENDING"
                        )
                        session.add(new_order)
                        await session.commit()
                        
                        tool_result = {
                            "status": "success", 
                            "order_id": new_order.id, 
                            "total_usd": total_usd,
                            "khqr_code": new_order.khqr_string,
                            "message_to_user": f"Order {new_order.id} created! Please scan the KHQR below to pay."
                        }
                    
                    # 4. Return result to Gemini
                    part_result = types.Part.from_function_response(
                        name="create_order",
                        response=tool_result
                    )
                    
                    final_response = await client.aio.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[prompt, response.candidates[0].content, part_result],
                        config=types.GenerateContentConfig(tools=[create_order_tool])
                    )
                    return final_response.text
                    
            return response.text
        except Exception as e:
            print(f"Gemini error: {e}")
            return "សុំទោសបង ពេលនេះមានបញ្ហាបច្ចេកទេសបន្តិច។"
