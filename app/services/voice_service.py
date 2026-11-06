import os
import httpx
import logging
from typing import Optional, Tuple
from google import genai
from google.genai import types
from app.config import settings

logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def transcribe_khmer_voice_note(
    audio_url: Optional[str] = None,
    audio_bytes: Optional[bytes] = None,
    mime_type: str = "audio/ogg"
) -> Tuple[str, float]:
    """
    Transcribes spoken Khmer or Khmeringlish voice notes using Gemini 2.5 Flash multimodal audio.
    Returns:
        (transcribed_text, estimated_duration_seconds)
    """
    try:
        data = audio_bytes
        detected_mime = mime_type

        if not data and audio_url:
            if audio_url.startswith("http://") or audio_url.startswith("https://"):
                async with httpx.AsyncClient(timeout=15.0) as http_client:
                    resp = await http_client.get(audio_url)
                    if resp.status_code == 200:
                        data = resp.content
                        content_type = resp.headers.get("content-type", "")
                        if content_type:
                            detected_mime = content_type.split(";")[0]

            elif os.path.exists(audio_url):
                with open(audio_url, "rb") as f:
                    data = f.read()

        if not data:
            return ("", 0.0)

        # Estimate duration roughly based on bytes if not provided (assume 16kbps ogg/aac)
        estimated_duration = max(2.0, min(120.0, len(data) / 3200.0))

        audio_part = types.Part.from_bytes(data=data, mime_type=detected_mime)

        prompt = (
            "You are a native Cambodian transcriber. Listen carefully to this voice note. "
            "Transcribe the spoken Khmer (ភាសានិយាយ) or Romanized Khmeringlish word-for-word into standard natural Khmer script. "
            "Do NOT summarize. Return ONLY the transcribed text in Khmer, with zero introductory remarks."
        )

        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=[types.Content(role="user", parts=[audio_part, types.Part.from_text(text=prompt)])]
        )

        transcription = (response.text or "").strip()
        return (transcription, estimated_duration)

    except Exception as e:
        logger.error(f"Khmer STT transcription error: {e}")
        return ("", 0.0)
