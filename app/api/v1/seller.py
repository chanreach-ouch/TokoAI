import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.db import get_db
from app.models.shop import Shop
from app.models.seller_persona import SellerPersonaProfile
from app.core.auth import get_current_seller
from app.services.persona_learner import extract_seller_persona_from_transcripts, save_learned_persona

router = APIRouter()

class ShopCreate(BaseModel):
    tiktok_page_id: str
    name: str
    bakong_merchant_id: str | None = None
    tiktok_access_token: str | None = None
    facebook_page_id: str | None = None
    facebook_access_token: str | None = None

@router.post("/shop", summary="Create or update shop")
async def create_or_update_shop(
    shop: ShopCreate, 
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    try:
        result = await db.execute(select(Shop).where(Shop.tiktok_page_id == shop.tiktok_page_id))
        existing_shop = result.scalar_one_or_none()
        
        if existing_shop:
            if str(existing_shop.owner_id) != seller_id and existing_shop.owner_id is not None:
                raise HTTPException(status_code=403, detail="Shop belongs to another user")
                
            existing_shop.name = shop.name
            existing_shop.owner_id = uuid.UUID(seller_id)
            if shop.bakong_merchant_id:
                existing_shop.bakong_merchant_id = shop.bakong_merchant_id
            if shop.tiktok_access_token:
                existing_shop.tiktok_access_token = shop.tiktok_access_token
            if shop.facebook_page_id:
                existing_shop.facebook_page_id = shop.facebook_page_id
            if shop.facebook_access_token:
                existing_shop.facebook_access_token = shop.facebook_access_token
            await db.commit()
            return {"status": "success", "message": "Shop updated", "shop_id": existing_shop.id}
            
        new_shop = Shop(
            tiktok_page_id=shop.tiktok_page_id,
            owner_id=uuid.UUID(seller_id),
            name=shop.name,
            bakong_merchant_id=shop.bakong_merchant_id,
            tiktok_access_token=shop.tiktok_access_token,
            facebook_page_id=shop.facebook_page_id,
            facebook_access_token=shop.facebook_access_token
        )
        db.add(new_shop)
        await db.commit()
        await db.refresh(new_shop)
        return {"status": "success", "message": "Shop created", "shop_id": new_shop.id}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class IntegrationsUpdate(BaseModel):
    tiktok_page_id: str | None = None
    bakong_merchant_id: str | None = None
    facebook_page_id: str | None = None
    facebook_access_token: str | None = None

@router.get("/integrations", summary="Get shop integrations")
async def get_integrations(
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    result = await db.execute(select(Shop).where(Shop.owner_id == uuid.UUID(seller_id)))
    shop = result.scalar_one_or_none()
    if not shop:
        return {"tiktok_page_id": "", "bakong_merchant_id": "", "facebook_page_id": ""}
    return {
        "shop_id": str(shop.id),
        "tiktok_page_id": shop.tiktok_page_id or "",
        "bakong_merchant_id": shop.bakong_merchant_id or "",
        "facebook_page_id": shop.facebook_page_id or ""
    }

@router.post("/integrations", summary="Update shop integrations")
async def update_integrations(
    data: IntegrationsUpdate,
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    result = await db.execute(select(Shop).where(Shop.owner_id == uuid.UUID(seller_id)))
    shop = result.scalar_one_or_none()
    
    if shop:
        if data.tiktok_page_id is not None:
            shop.tiktok_page_id = data.tiktok_page_id
        if data.bakong_merchant_id is not None:
            shop.bakong_merchant_id = data.bakong_merchant_id
        if data.facebook_page_id is not None:
            shop.facebook_page_id = data.facebook_page_id
        if data.facebook_access_token is not None:
            shop.facebook_access_token = data.facebook_access_token
        await db.commit()
    else:
        shop = Shop(
            tiktok_page_id=data.tiktok_page_id or f"temp_{uuid.uuid4().hex[:8]}",
            owner_id=uuid.UUID(seller_id),
            name="My Shop",
            bakong_merchant_id=data.bakong_merchant_id,
            facebook_page_id=data.facebook_page_id,
            facebook_access_token=data.facebook_access_token
        )
        db.add(shop)
        await db.commit()
        
    return {"status": "success", "shop_id": str(shop.id)}

# ==============================================================================
# MODULE 1: Historical Seller Persona Cloning & First-Message Hook Endpoints
# ==============================================================================

class IngestHistoryRequest(BaseModel):
    transcripts: str

class PersonaUpdateRequest(BaseModel):
    selling_signature_summary: Optional[str] = None
    opening_hooks: Optional[List[str]] = None
    persuasion_tactics: Optional[List[str]] = None
    avg_reply_length_chars: Optional[int] = None
    avg_voice_duration_sec: Optional[float] = None
    preferred_reply_modality: Optional[str] = None # TEXT_ONLY, VOICE_AND_TEXT, ADAPTIVE

@router.post("/shops/{shop_id}/ingest-history", summary="Ingest historical transcripts to clone seller persona")
async def ingest_chat_history(
    shop_id: uuid.UUID,
    payload: IngestHistoryRequest,
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    # Verify shop ownership
    stmt = select(Shop).where(Shop.id == shop_id, Shop.owner_id == uuid.UUID(seller_id))
    shop_res = await db.execute(stmt)
    shop = shop_res.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found or access denied")

    if not payload.transcripts.strip():
        raise HTTPException(status_code=400, detail="Transcripts cannot be empty")

    # Extract persona features via Gemini 2.5 Flash
    learned_persona = await extract_seller_persona_from_transcripts(payload.transcripts)
    
    # Save into SellerPersonaProfile
    profile = await save_learned_persona(shop.id, learned_persona, raw_transcripts=payload.transcripts[:20000])

    return {
        "status": "success",
        "message": "Historical seller persona cloned successfully",
        "persona": {
            "selling_signature_summary": profile.selling_signature_summary,
            "opening_hooks": profile.opening_hooks,
            "persuasion_tactics": profile.persuasion_tactics,
            "avg_reply_length_chars": profile.avg_reply_length_chars,
            "avg_voice_duration_sec": profile.avg_voice_duration_sec,
            "preferred_reply_modality": profile.preferred_reply_modality
        }
    }

@router.get("/shops/{shop_id}/persona", summary="Get cloned seller persona profile")
async def get_shop_persona(
    shop_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    stmt = select(SellerPersonaProfile).where(SellerPersonaProfile.shop_id == shop_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        return {
            "selling_signature_summary": "Friendly boutique admin with warm spoken Khmer.",
            "opening_hooks": ["សួស្តីបង! ម៉ូដនេះទើបមកដល់ក្តៅៗ សាច់ស្អាតខ្លាំងណា៎បង ✨"],
            "persuasion_tactics": ["ពន្យល់ពីគុណភាពសាច់ក្រណាត់ធានាជូន", "Free Delivery បើទិញ ២ ឡើងទៅ"],
            "avg_reply_length_chars": 95,
            "avg_voice_duration_sec": 12.0,
            "preferred_reply_modality": "ADAPTIVE",
            "is_trained": False
        }

    return {
        "id": str(profile.id),
        "shop_id": str(profile.shop_id),
        "selling_signature_summary": profile.selling_signature_summary,
        "opening_hooks": profile.opening_hooks or [],
        "persuasion_tactics": profile.persuasion_tactics or [],
        "avg_reply_length_chars": profile.avg_reply_length_chars,
        "avg_voice_duration_sec": profile.avg_voice_duration_sec,
        "preferred_reply_modality": profile.preferred_reply_modality,
        "is_trained": bool(profile.selling_signature_summary)
    }

@router.put("/shops/{shop_id}/persona", summary="Update cloned seller persona profile")
async def update_shop_persona(
    shop_id: uuid.UUID,
    payload: PersonaUpdateRequest,
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    stmt = select(SellerPersonaProfile).where(SellerPersonaProfile.shop_id == shop_id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()

    if not profile:
        profile = SellerPersonaProfile(shop_id=shop_id)
        db.add(profile)

    if payload.selling_signature_summary is not None:
        profile.selling_signature_summary = payload.selling_signature_summary
    if payload.opening_hooks is not None:
        profile.opening_hooks = payload.opening_hooks
    if payload.persuasion_tactics is not None:
        profile.persuasion_tactics = payload.persuasion_tactics
    if payload.avg_reply_length_chars is not None:
        profile.avg_reply_length_chars = payload.avg_reply_length_chars
    if payload.avg_voice_duration_sec is not None:
        profile.avg_voice_duration_sec = payload.avg_voice_duration_sec
    if payload.preferred_reply_modality is not None:
        profile.preferred_reply_modality = payload.preferred_reply_modality

    await db.commit()
    return {"status": "success", "message": "Persona profile updated"}

# ==============================================================================
# MODULE 2: Voice Configuration & Smart Escalation Rules
# ==============================================================================

class VoiceSettingsUpdate(BaseModel):
    voice_clone_enabled: bool
    voice_model_id: Optional[str] = "khmer_boutique_female_v1"
    max_voice_seconds: Optional[int] = 30
    preferred_reply_modality: Optional[str] = "ADAPTIVE"

@router.get("/shops/{shop_id}/voice-settings", summary="Get shop voice AI settings")
async def get_voice_settings(
    shop_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    stmt = select(Shop).where(Shop.id == shop_id, Shop.owner_id == uuid.UUID(seller_id))
    res = await db.execute(stmt)
    shop = res.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    return {
        "voice_clone_enabled": bool(shop.voice_clone_enabled),
        "voice_model_id": shop.voice_model_id or "khmer_boutique_female_v1",
        "max_voice_seconds": shop.max_voice_seconds or 30,
        "preferred_reply_modality": shop.preferred_reply_modality or "ADAPTIVE"
    }

@router.put("/shops/{shop_id}/voice-settings", summary="Update shop voice AI settings")
async def update_voice_settings(
    shop_id: uuid.UUID,
    payload: VoiceSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    stmt = select(Shop).where(Shop.id == shop_id, Shop.owner_id == uuid.UUID(seller_id))
    res = await db.execute(stmt)
    shop = res.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    shop.voice_clone_enabled = payload.voice_clone_enabled
    shop.voice_model_id = payload.voice_model_id
    shop.max_voice_seconds = payload.max_voice_seconds
    shop.preferred_reply_modality = payload.preferred_reply_modality
    await db.commit()

    return {"status": "success", "message": "Voice AI settings updated"}

class EscalationRulesUpdate(BaseModel):
    bulk_order_threshold_qty: Optional[int] = 10
    bulk_order_threshold_usd: Optional[float] = 100.0
    escalate_on_complaint: Optional[bool] = True
    custom_trigger_keywords: Optional[List[str]] = None

@router.get("/shops/{shop_id}/escalation-rules", summary="Get shop human escalation rules")
async def get_escalation_rules(
    shop_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    stmt = select(Shop).where(Shop.id == shop_id, Shop.owner_id == uuid.UUID(seller_id))
    res = await db.execute(stmt)
    shop = res.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    rules = shop.escalation_rules or {
        "bulk_order_threshold_qty": 10,
        "bulk_order_threshold_usd": 100.0,
        "escalate_on_complaint": True,
        "custom_trigger_keywords": ["refund", "fake", "broken", "complaint", "ខូច", "បោក", "ជួប admin"]
    }
    return rules

@router.put("/shops/{shop_id}/escalation-rules", summary="Update shop human escalation rules")
async def update_escalation_rules(
    shop_id: uuid.UUID,
    payload: EscalationRulesUpdate,
    db: AsyncSession = Depends(get_db),
    seller_id: str = Depends(get_current_seller)
):
    stmt = select(Shop).where(Shop.id == shop_id, Shop.owner_id == uuid.UUID(seller_id))
    res = await db.execute(stmt)
    shop = res.scalar_one_or_none()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    current_rules = dict(shop.escalation_rules or {})
    if payload.bulk_order_threshold_qty is not None:
        current_rules["bulk_order_threshold_qty"] = payload.bulk_order_threshold_qty
    if payload.bulk_order_threshold_usd is not None:
        current_rules["bulk_order_threshold_usd"] = payload.bulk_order_threshold_usd
    if payload.escalate_on_complaint is not None:
        current_rules["escalate_on_complaint"] = payload.escalate_on_complaint
    if payload.custom_trigger_keywords is not None:
        current_rules["custom_trigger_keywords"] = payload.custom_trigger_keywords

    shop.escalation_rules = current_rules
    await db.commit()
    return {"status": "success", "message": "Escalation rules updated", "rules": shop.escalation_rules}
