import os
import json
from google import genai
from google.genai import types

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

def embed_text(text: str) -> list[float]:
    """
    Takes product text or user text and converts it to a 768-dimensional vector using text-embedding-004.
    """
    if not client:
        return [0.0] * 768
    
    try:
        result = client.models.embed_content(
            model="text-embedding-004",
            contents=text,
        )
        return result.embeddings[0].values
    except Exception:
        return [0.0] * 768

def embed_query(text: str) -> list[float]:
    return embed_text(text)

def extract_vision_data(image_bytes: bytes, mime_type: str) -> dict:
    """
    Uses Gemini 2.5 Flash to extract product information from an image.
    Returns a dict with name, category, color, description, and suggested retail price.
    """
    if not client:
        return {
            "name": "Product from Vision",
            "category": "Apparel",
            "color": "Black",
            "description": "Please add a GEMINI_API_KEY to your .env file to enable real vision extraction.",
            "price": 18.0,
            "min_negotiation_price": 15.0
        }

    prompt = """
    Analyze this product image for a Cambodian TikTok / online retail shop and extract the following details in JSON format.
    Return ONLY a valid JSON object matching these exact keys, no markdown:
    {
        "name": "Short compelling English product name (e.g. 'Oversized Vintage Acid Wash Tee')",
        "name_kh": "Natural Khmer product name (e.g. 'អាវយឺត Oversized ម៉ូដ Vintage ពេញនិយម')",
        "category": "Broad category like Streetwear, Cosmetics, Footwear, Electronics",
        "color": "Primary color",
        "price": 18.0,
        "min_negotiation_price": 15.0,
        "description": "A 1-2 sentence compelling description for e-commerce."
    }
    """
    
    try:
        part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[part, types.Part.from_text(text=prompt)],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"Vision error: {e}")
        return {
            "name": "Vision Product",
            "category": "General",
            "color": "Standard",
            "description": "Extracted via TokoAI Vision",
            "price": 18.0,
            "min_negotiation_price": 15.0
        }

def generate_chat_reply(customer_msg: str, seller_tone: str, faqs: list, matched_products: list, has_image: bool = False, image_bytes: bytes = None, image_mime: str = None) -> tuple[str, str | None]:
    if not client:
        return ("Hi! Please set GEMINI_API_KEY in your .env to use the real AI.", None)

    system_prompt = f"""You are an autonomous AI sales agent for a TikTok e-commerce store in Cambodia.
Tone: {seller_tone}

STORE RULES:
{faqs}

TOP MATCHING PRODUCTS:
"""
    for p in matched_products:
        system_prompt += f"- {p['name']} | Price: ${p['price']} | Stock: {p['stock']} | ID: {p['id']}\n"

    try:
        contents = []
        if has_image and image_bytes:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=image_mime or "image/jpeg"))
        contents.append(types.Part.from_text(text=customer_msg))

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(system_instruction=system_prompt)
        )
        reply_text = response.text or ""
        image_url = matched_products[0]['image_url'] if matched_products and "is this the item" in reply_text.lower() else None
        return reply_text, image_url
    except Exception as e:
        print(f"Chat error: {e}")
        return ("សុំទោសបង ពេលនេះប្រព័ន្ធ AI កំពុងរវល់បន្តិច សូមទាក់ទងមកម្ដងទៀតណា៎បង!", None)
