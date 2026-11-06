import json
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types
from sqlalchemy import select
from app.config import settings
from app.core.db import AsyncSessionLocal
from app.models.seller_persona import SellerPersonaProfile
from app.models.shop import Shop

logger = logging.getLogger(__name__)
client = genai.Client(api_key=settings.GEMINI_API_KEY, http_options={"api_version": "v1beta"})

async def extract_seller_persona_from_transcripts(transcripts: str) -> Dict[str, Any]:
    """
    Uses Gemini 2.5 Flash to analyze historical high-converting Cambodian seller chat transcripts.
    Extracts authentic spoken Khmer tone, first-message hooks, objection handling, and reply pacing.
    """
    prompt = f"""You are an expert sales conversational analyst specializing in Cambodian retail commerce on TikTok Shop and Facebook Messenger.
Analyze the following chat transcripts where the shop owner successfully closed sales with Cambodian customers.

Transcripts:
\"\"\"
{transcripts[:12000]}
\"\"\"

Extract the owner's authentic sales persona and habits in JSON format.
Return ONLY valid JSON matching this exact structure:
{{
    "selling_signature_summary": "Concise 2-3 sentence description of their tone (e.g. sisterly warmth, high-energy, polite, uses specific Khmer colloquialisms like ចា៎បង, អូន, ណា៎បង, ហ្នឹងហើយបង)",
    "opening_hooks": [
        "First message opening greeting / hook 1 in spoken Khmer",
        "Alternative hook 2 in spoken Khmer",
        "Alternative hook 3 in spoken Khmer"
    ],
    "persuasion_tactics": [
        "Key tactic 1 used to convince buyers (e.g. offering free delivery for 2 items, assuring authentic fabric, fast dispatch)",
        "Key tactic 2 for overcoming price resistance",
        "Key tactic 3"
    ],
    "avg_reply_length_chars": 90,
    "avg_voice_duration_sec": 12.0,
    "preferred_reply_modality": "ADAPTIVE"
}}
"""

    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        parsed = json.loads(response.text.strip())
        return parsed
    except Exception as e:
        logger.error(f"Error analyzing seller transcripts: {e}")
        return {
            "selling_signature_summary": "Friendly, responsive boutique seller in spoken Khmer using ចា៎បង and warm emojis.",
            "opening_hooks": ["សួស្តីបង! ម៉ូដនេះទើបមកដល់ក្តៅៗ សាច់ស្អាតខ្លាំងណា៎បង ✨"],
            "persuasion_tactics": ["ពន្យល់ពីគុណភាពសាច់ក្រណាត់ធានាជូន", "Free Delivery បើទិញ ២ ឡើងទៅ"],
            "avg_reply_length_chars": 95,
            "avg_voice_duration_sec": 12.0,
            "preferred_reply_modality": "ADAPTIVE"
        }

async def save_learned_persona(shop_id, persona_data: Dict[str, Any], raw_transcripts: str = ""):
    """
    Persists learned persona profile into PostgreSQL database for the shop.
    Computes 768d embedding for semantic retrieval.
    """
    async with AsyncSessionLocal() as session:
        stmt = select(SellerPersonaProfile).where(SellerPersonaProfile.shop_id == shop_id)
        res = await session.execute(stmt)
        profile = res.scalar_one_or_none()

        # Compute vector embedding of persona summary
        summary_text = f"{persona_data.get('selling_signature_summary', '')} {' '.join(persona_data.get('persuasion_tactics', []))}"
        embedding_vector = None
        try:
            embed_resp = client.models.embed_content(
                model="text-embedding-004",
                contents=summary_text,
            )
            embedding_vector = embed_resp.embeddings[0].values
        except Exception as e:
            logger.warning(f"Persona embedding error: {e}")

        if not profile:
            profile = SellerPersonaProfile(
                shop_id=shop_id,
                selling_signature_summary=persona_data.get("selling_signature_summary"),
                opening_hooks=persona_data.get("opening_hooks", []),
                persuasion_tactics=persona_data.get("persuasion_tactics", []),
                avg_reply_length_chars=int(persona_data.get("avg_reply_length_chars", 95)),
                avg_voice_duration_sec=float(persona_data.get("avg_voice_duration_sec", 12.0)),
                preferred_reply_modality=persona_data.get("preferred_reply_modality", "ADAPTIVE"),
                historical_samples_embedding=embedding_vector,
                raw_training_transcripts=raw_transcripts
            )
            session.add(profile)
        else:
            profile.selling_signature_summary = persona_data.get("selling_signature_summary", profile.selling_signature_summary)
            profile.opening_hooks = persona_data.get("opening_hooks", profile.opening_hooks)
            profile.persuasion_tactics = persona_data.get("persuasion_tactics", profile.persuasion_tactics)
            profile.avg_reply_length_chars = int(persona_data.get("avg_reply_length_chars", profile.avg_reply_length_chars))
            profile.avg_voice_duration_sec = float(persona_data.get("avg_voice_duration_sec", profile.avg_voice_duration_sec))
            profile.preferred_reply_modality = persona_data.get("preferred_reply_modality", profile.preferred_reply_modality)
            if embedding_vector:
                profile.historical_samples_embedding = embedding_vector
            if raw_transcripts:
                profile.raw_training_transcripts = raw_transcripts

        await session.commit()
        return profile
