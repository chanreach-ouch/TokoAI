import os
import sys
import time
from google import genai
from google.genai import types
from app.config import settings
from app.agent.prompts import get_system_prompt
from app.agent.tools.address_parser import parse_address_and_phone

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

client = genai.Client(api_key=settings.GEMINI_API_KEY)

# Mock Store Catalog
MOCK_CATALOG = """
Relevant Products Catalog:
- Oversized Streetwear Tee (Black) (SKU: TEE-BLK-01): $12.00 (49,200 ៛) - Premium breathable cotton streetwear t-shirt. Sizes: M, L, XL. (Stock: 50)
- Glow Vitamin C Serum (SKU: SERUM-VITC): $18.50 (75,850 ៛) - Brightening serum removing dark spots. (Stock: 20)
- Minimalist Crossbody Bag (Black) (SKU: BAG-MIN-BLK): $25.00 (102,500 ៛) - Small waterproof leather crossbody bag. (Stock: 5)
- Vintage Denim Jacket (SKU: JKT-DENIM-01): $35.00 (143,500 ៛) - Classic retro denim jacket. (Stock: 0)

Store Custom FAQs & Store Rules:
- Q: Do you ship to provinces?
  A: Yes, we ship nationwide via J&T and Virak Buntham VET.
- Q: How can I pay?
  A: We accept Bakong KHQR, ABA Bank scan, and Cash on Delivery (COD).
"""

agent_tools = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="create_order",
            description="Creates a new order for the customer. Supports both Bakong KHQR and Cash on Delivery (COD).",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "sku": types.Schema(type=types.Type.STRING, description="The exact SKU or product name to buy"),
                    "quantity": types.Schema(type=types.Type.INTEGER, description="Quantity to purchase"),
                    "payment_method": types.Schema(type=types.Type.STRING, description="'KHQR' or 'COD'"),
                    "delivery_city": types.Schema(type=types.Type.STRING, description="'Phnom Penh' or province name"),
                    "customer_phone": types.Schema(type=types.Type.STRING, description="Customer Cambodian phone number"),
                    "delivery_address": types.Schema(type=types.Type.STRING, description="Customer landmark delivery address")
                },
                required=["sku", "quantity"]
            )
        ),
        types.FunctionDeclaration(
            name="escalate_to_human",
            description="Escalates conversation to a human store manager and pauses automated AI responses.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "reason": types.Schema(type=types.Type.STRING, description="Reason for escalation")
                },
                required=["reason"]
            )
        )
    ]
)

def run_chat_turn(system_prompt: str, user_msg: str, chat_history: list = None) -> tuple[str, any]:
    history_str = "\n".join(chat_history) if chat_history else "None (first turn)"
    user_prompt = f"""Shop ID: mock-shop-123

Context:
{MOCK_CATALOG}

Recent Chat History:
{history_str}

Customer Message: {user_msg}
Provide your response in authentic spoken Khmer:"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            tools=[agent_tools],
            temperature=0.3
        )
    )

    if response.function_calls:
        fc = response.function_calls[0]
        if fc.name == "create_order":
            sku = fc.args.get("sku")
            qty = fc.args.get("quantity", 1)
            city = fc.args.get("delivery_city", "Phnom Penh")
            phone = fc.args.get("customer_phone")
            addr = fc.args.get("delivery_address")
            pay_method = fc.args.get("payment_method", "KHQR")
            
            geo = parse_address_and_phone(f"{addr or ''} {city} {phone or ''} {user_msg}")
            fee = geo["delivery_fee_usd"]
            subtotal = 12.0 * qty
            total = subtotal + fee
            
            tool_res = {
                "status": "success",
                "order_id": "ORD-MOCK-999",
                "subtotal_usd": subtotal,
                "delivery_fee_usd": fee,
                "total_usd": total,
                "total_khr": int(total * 4100),
                "payment_method": pay_method,
                "message_to_user": f"Order #{sku} placed with {pay_method}! Total: ${total:.2f} ({int(total*4100):,} ៛) including ${fee:.2f} delivery."
            }
            
            part_result = types.Part.from_function_response(name="create_order", response=tool_res)
            tool_content = types.Content(role="tool", parts=[part_result])
            
            final_res = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)]),
                    response.candidates[0].content,
                    tool_content
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    tools=[agent_tools]
                )
            )
            return (final_res.text or "").strip() or tool_res["message_to_user"], fc

        elif fc.name == "escalate_to_human":
            part_result = types.Part.from_function_response(name="escalate_to_human", response={"status": "escalated"})
            tool_content = types.Content(role="tool", parts=[part_result])
            final_res = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Content(role="user", parts=[types.Part.from_text(text=user_prompt)]),
                    response.candidates[0].content,
                    tool_content
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    tools=[agent_tools]
                )
            )
            return (final_res.text or "").strip() or "អូនបានជូនដំណឹងទៅកាន់បងៗ Admin មនុស្សផ្ទាល់ហើយបង គាត់នឹងចូលមកឆ្លើយតបជូនបងភ្លាមៗណា៎បង!", fc

    return response.text, None

def evaluate_quality():
    print("=" * 70)
    print("🧪 TOKOAI CHATBOT INTELLIGENCE & QUALITY BENCHMARK SUITE")
    print("=" * 70)

    system_prompt = get_system_prompt("Friendly", "Vogue Boutique")

    test_cases = [
        {
            "category": "1. Khmeringlish Greeting & Availability",
            "message": "man stock tee black ot b? price man?",
            "expected": "Understands 'tee black' and price, replies in spoken Khmer with USD & KHR"
        },
        {
            "category": "2. Bargaining / Negotiation ('Chos ban ot?')",
            "message": "chos oy 2$ tv b tlai mes, yok 2",
            "expected": "Handles negotiation warmly, offers Free Delivery for 2 items instead of slashing price below floor"
        },
        {
            "category": "3. Delivery Rate & Timeframe (Provincial)",
            "message": "ship tov siem reap ponton b? ponman ngai dol?",
            "expected": "Quotes $2.50 provincial shipping and 1-2 days delivery via Virak Buntham/J&T"
        },
        {
            "category": "4. Out of Stock Upselling",
            "message": "jong ban vintage denim jacket man stock ot?",
            "expected": "Politely mentions denim jacket is out of stock, recommends in-stock alternative (Streetwear Tee or Crossbody Bag)"
        },
        {
            "category": "5. Closing Order via Cash on Delivery (COD)",
            "message": "ok yok streetwear tee size L 1, deliver tov toul kork 012 998 877, kod ban ot?",
            "expected": "Triggers create_order with COD, captures phone (012998877) and address (toul kork), confirms order warmly"
        },
        {
            "category": "6. Escalation to Human Staff",
            "message": "jong jop admin mnos phtal! call mk knhom oy lerk!",
            "expected": "Detects customer wants human admin, triggers escalate_to_human tool and pauses AI"
        }
    ]

    for idx, tc in enumerate(test_cases, 1):
        print(f"\n▶ TEST CATEGORY: {tc['category']}")
        print(f"  Customer Inquiry: \"{tc['message']}\"")
        reply, fc = run_chat_turn(system_prompt, tc["message"])
        if fc:
            print(f"  🔧 Tool Triggered: {fc.name} | Arguments: {dict(fc.args)}")
        print(f"  🤖 TokoAI Response:\n{reply.strip()}")
        print("-" * 70)
        if idx < len(test_cases):
            time.sleep(13)

if __name__ == "__main__":
    evaluate_quality()
