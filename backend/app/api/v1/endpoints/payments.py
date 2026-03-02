from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, HttpUrl
from supabase import create_client, Client

from app.core.config import settings
from app.core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


class CheckoutSessionRequest(BaseModel):
    price_id: str
    plan_name: str
    success_url: HttpUrl
    cancel_url: HttpUrl


def _supabase_admin() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def _price_plan_map() -> Dict[str, str]:
    if not settings.STRIPE_PRICE_PLAN_MAP:
        return {}
    try:
        raw = json.loads(settings.STRIPE_PRICE_PLAN_MAP)
        if isinstance(raw, dict):
            return {str(k): str(v) for k, v in raw.items()}
    except Exception as exc:
        logger.warning("Invalid STRIPE_PRICE_PLAN_MAP: %s", exc)
    return {}


@router.post("/create-checkout-session")
async def create_checkout_session(
    payload: CheckoutSessionRequest,
    current_user: Any = Depends(get_current_user),
):
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe secret key not configured")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    mapped_plan = _price_plan_map().get(payload.price_id)
    plan_name = mapped_plan or payload.plan_name

    if not plan_name:
        raise HTTPException(status_code=400, detail="Plan name is required")

    supabase = _supabase_admin()
    plan_resp = supabase.table("plans").select("id").eq("name", plan_name).single().execute()
    if not plan_resp.data:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {plan_name}")

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{"price": payload.price_id, "quantity": 1}],
            success_url=str(payload.success_url),
            cancel_url=str(payload.cancel_url),
            customer_email=getattr(current_user, "email", None),
            metadata={
                "supabase_user_id": str(current_user.id),
                "plan_name": plan_name,
            },
        )
    except stripe.error.StripeError as exc:
        logger.exception("Stripe checkout error: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to create checkout session") from exc

    return {"url": session.url}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    if not settings.STRIPE_WEBHOOK_SECRET or not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Stripe webhook not configured")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid signature") from exc

    supabase = _supabase_admin()

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata") or {}
        user_id = metadata.get("supabase_user_id")
        plan_name = metadata.get("plan_name")

        if not user_id or not plan_name:
            logger.error("Stripe session missing metadata: %s", session.get("id"))
            raise HTTPException(status_code=400, detail="Missing metadata")

        plan_resp = supabase.table("plans").select("id").eq("name", plan_name).single().execute()
        plan = plan_resp.data
        if not plan:
            logger.error("Unknown plan in Stripe metadata: %s", plan_name)
            raise HTTPException(status_code=400, detail="Unknown plan")

        now = datetime.now(timezone.utc).isoformat()
        update_payload = {
            "plan_id": plan["id"],
            "status": "active",
            "trial_ends_at": None,
            "activated_at": now,
        }

        update_resp = supabase.table("user_entitlements").update(update_payload).eq("user_id", user_id).execute()
        entitlement_id = None
        if update_resp.data:
            entitlement_id = update_resp.data[0].get("id")
        else:
            insert_payload = {
                "user_id": user_id,
                **update_payload,
            }
            insert_resp = supabase.table("user_entitlements").insert(insert_payload).execute()
            if insert_resp.data:
                entitlement_id = insert_resp.data[0].get("id")

        amount_total = session.get("amount_total")
        currency = session.get("currency") or "usd"
        payment_status = session.get("payment_status") or "paid"
        status_value = "succeeded" if payment_status == "paid" else "pending"

        payment_payload = {
            "user_id": user_id,
            "entitlement_id": entitlement_id,
            "amount": (amount_total / 100) if isinstance(amount_total, (int, float)) else 0,
            "currency": currency.upper(),
            "status": status_value,
            "stripe_payment_intent_id": session.get("payment_intent"),
            "description": session.get("description") or f"{plan_name} purchase",
            "metadata": {"checkout_session_id": session.get("id")},
        }
        supabase.table("payment_history").insert(payment_payload).execute()

    return {"received": True}
