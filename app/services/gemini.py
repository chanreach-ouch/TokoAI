import os
import google.generativeai as genai
import json

# Configure Gemini API Key
# Usually done in main.py or startup, but doing here for simplicity
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def embed_text(text: str) -> list[float]:
    """
    Takes product text or user text and converts it to a 768-dimensional vector using text-embedding-004.
    """
    if not api_key:
        # Fallback dummy embedding if no key is present for testing
        return [0.0] * 768
    
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_document"
    )
    return result['embedding']

def embed_query(text: str) -> list[float]:
    if not api_key:
        return [0.0] * 768
        
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="retrieval_query"
    )
    return result['embedding']

def extract_vision_data(image_bytes: bytes, mime_type: str) -> dict:
    """
    Uses Gemini 1.5 Flash to extract product information from an image.
    Returns a dict with name, category, color, description.
    """
    if not api_key:
        return {
            "name": "Dummy Product from Vision",
            "category": "Apparel",
            "color": "Black",
            "description": "Please add a GEMINI_API_KEY to your .env file to enable real vision extraction."
        }

    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = """
    Analyze this product image and extract the following details in JSON format.
    Return ONLY a JSON object with these exact keys, no markdown wrappers:
    {
        "name": "Short descriptive name",
        "category": "Broad category like Clothing, Electronics, Cosmetics",
        "color": "Primary color",
        "description": "A 1-2 sentence compelling description for e-commerce."
    }
    """
    
    try:
        response = model.generate_content([
            {'mime_type': mime_type, 'data': image_bytes},
            prompt
        ])
        # Clean potential markdown
        text = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(text)
    except Exception as e:
        print(f"Vision error: {e}")
        return {}

def generate_chat_reply(customer_msg: str, seller_tone: str, faqs: list, matched_products: list, has_image: bool = False, image_bytes: bytes = None, image_mime: str = None) -> tuple[str, str]:
    """
    The core Multimodal RAG Chat Engine.
    Returns (reply_text, image_url_if_needed).
    """
    if not api_key:
        return ("Hi! Please set GEMINI_API_KEY in your .env to use the real AI.", None)

    # 1. Build the System Prompt
    system_prompt = f"""
    You are an autonomous AI sales agent for a TikTok e-commerce store.
    Your tone is: {seller_tone}
    
    STORE RULES (FAQs):
    {faqs}
    
    TOP MATCHING PRODUCTS IN STOCK:
    """
    for p in matched_products:
        system_prompt += f"- {p['name']} | Price: {p['price']} | Stock: {p['stock']} | ID: {p['id']}\n"
        
    system_prompt += """
    INSTRUCTIONS:
    1. Answer the customer's question directly based ONLY on the products and rules provided.
    2. If they ask to buy something we have in stock, say you will generate a Bakong QR code.
    3. If they sent an image, look at the matched products. If the best match is similar but you are NOT 100% certain it's identical, ask them: "Is this the item you are looking for?" and the system will attach the product image.
    4. If we don't have it, politely say so. Do not invent products.
    """

    model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_prompt)
    
    # 2. Add customer content (Text + Optional Image)
    content = []
    if has_image and image_bytes:
        content.append({'mime_type': image_mime, 'data': image_bytes})
    content.append(customer_msg)
    
    try:
        response = model.generate_content(content)
        
        # 3. Simple heuristic to determine if we should send an image back
        # Real implementation would use function calling or structured output,
        # but for now we look for our exact trigger phrase.
        reply_text = response.text
        image_url = None
        
        if "Is this the item you are looking for" in reply_text and matched_products:
            image_url = matched_products[0]['image_url']
            
        return reply_text, image_url
        
    except Exception as e:
        print(f"Chat error: {e}")
        return ("Sorry, I'm having trouble processing that right now.", None)
