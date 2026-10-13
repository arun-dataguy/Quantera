"""
routers/stripe_router.py — Stripe checkout, webhooks, billing portal
"""
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.config import settings
from app.models.user import User, PlanTier
from app.routers.auth import get_current_user, get_db

stripe.api_key = settings.stripe_secret_key

router = APIRouter(tags=["Stripe"])


class CheckoutRequest(BaseModel):
    plan: str  # "pro" or "premium"


# ── Create checkout session ───────────────────────────────────────────────────

@router.post("/checkout")
async def create_checkout(
    body: CheckoutRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.plan not in ["pro", "premium"]:
        raise HTTPException(status_code=400, detail="Invalid plan")

    price_id = (
        settings.stripe_pro_price_id
        if body.plan == "pro"
        else settings.stripe_premium_price_id
    )

    # Create or retrieve Stripe customer
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": str(user.id)},
        )
        await db.execute(
            update(User).where(User.id == user.id).values(
                stripe_customer_id=customer.id
            )
        )
        await db.commit()
        customer_id = customer.id
    else:
        customer_id = user.stripe_customer_id

    # Create checkout session
    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.frontend_url}/billing?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.frontend_url}/pricing",
        metadata={"user_id": str(user.id), "plan": body.plan},
        subscription_data={
            "metadata": {"user_id": str(user.id), "plan": body.plan}
        },
    )

    return {"checkout_url": session.url, "session_id": session.id}


# ── Billing portal ────────────────────────────────────────────────────────────

@router.post("/portal")
async def billing_portal(
    user: User = Depends(get_current_user),
):
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found")

    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.frontend_url}/dashboard",
    )
    return {"portal_url": session.url}


# ── Webhook ───────────────────────────────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data = event["data"]["object"]

    # ── Payment succeeded → upgrade plan ─────────────────────────────────────
    if event_type == "checkout.session.completed":
        user_id = int(data["metadata"].get("user_id", 0))
        plan = data["metadata"].get("plan", "free")
        subscription_id = data.get("subscription")

        if user_id and plan in ["pro", "premium"]:
            await db.execute(
                update(User).where(User.id == user_id).values(
                    plan=PlanTier(plan),
                    stripe_subscription_id=subscription_id,
                    subscription_status="active",
                )
            )
            await db.commit()

    # ── Subscription updated ──────────────────────────────────────────────────
    elif event_type == "customer.subscription.updated":
        sub_id = data["id"]
        status = data["status"]
        plan = data["metadata"].get("plan", "free")

        if status == "active":
            await db.execute(
                update(User).where(User.stripe_subscription_id == sub_id).values(
                    plan=PlanTier(plan) if plan in ["pro", "premium"] else PlanTier.free,
                    subscription_status=status,
                )
            )
        await db.commit()

    # ── Subscription cancelled ────────────────────────────────────────────────
    elif event_type in ["customer.subscription.deleted", "customer.subscription.paused"]:
        sub_id = data["id"]
        await db.execute(
            update(User).where(User.stripe_subscription_id == sub_id).values(
                plan=PlanTier.free,
                subscription_status="cancelled",
                stripe_subscription_id=None,
            )
        )
        await db.commit()

    # ── Payment failed ────────────────────────────────────────────────────────
    elif event_type == "invoice.payment_failed":
        customer_id = data.get("customer")
        if customer_id:
            await db.execute(
                update(User).where(User.stripe_customer_id == customer_id).values(
                    subscription_status="past_due",
                )
            )
            await db.commit()

    return JSONResponse({"status": "ok"})


# ── Get subscription status ───────────────────────────────────────────────────

@router.get("/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    return {
        "plan": user.plan.value if user.plan else "free",
        "status": user.subscription_status,
        "stripe_customer_id": user.stripe_customer_id,
        "has_subscription": bool(user.stripe_subscription_id),
    }