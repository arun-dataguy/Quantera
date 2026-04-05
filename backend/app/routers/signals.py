from fastapi import APIRouter, Depends, Query
from app.services.signal_engine import get_live_signals
from app.routers.auth import get_current_user
from app.models.user import User, PlanTier
from fastapi import HTTPException

router = APIRouter()

# Simple in-memory cache — refreshes every 30 mins
_cache = {"stocks": None, "crypto": None}
_cache_time = {"stocks": None, "crypto": None}
CACHE_TTL = 1800  # 30 minutes


@router.get("/latest")
async def get_signals(
    market: str = Query("stocks", enum=["stocks", "crypto"]),
    current_user: User = Depends(get_current_user),
):
    """Get live AI trading signals."""
    # Crypto requires Premium
    if market == "crypto" and current_user.plan not in [PlanTier.PREMIUM]:
        raise HTTPException(
            status_code=403,
            detail="Crypto signals require Premium plan"
        )

    from datetime import datetime
    now = datetime.utcnow().timestamp()

    # Return cached if fresh
    if _cache[market] and _cache_time[market]:
        age = now - _cache_time[market]
        if age < CACHE_TTL:
            signals = _cache[market]
            # Free users get max 5 signals
            if current_user.plan == PlanTier.FREE:
                signals = signals[:5]
            return {
                "signals": signals,
                "cached": True,
                "cache_age_seconds": int(age),
                "market": market,
            }

    # Fetch fresh signals
    signals = await get_live_signals(market)
    _cache[market] = signals
    _cache_time[market] = now

    # Free users get max 5 signals
    if current_user.plan == PlanTier.FREE:
        signals = signals[:5]

    return {
        "signals": signals,
        "cached": False,
        "market": market,
        "total": len(signals),
    }


@router.get("/latest/public")
async def get_public_signals():
    """Public endpoint — 3 signals for landing page, no auth needed."""
    from datetime import datetime
    now = datetime.utcnow().timestamp()

    if _cache["stocks"] and _cache_time["stocks"]:
        age = now - _cache_time["stocks"]
        if age < CACHE_TTL:
            return {"signals": _cache["stocks"][:3], "market": "stocks"}

    signals = await get_live_signals("stocks")
    _cache["stocks"] = signals
    _cache_time["stocks"] = now
    return {"signals": signals[:3], "market": "stocks"}


@router.get("/stats")
async def get_signal_stats(current_user: User = Depends(get_current_user)):
    """Get signal summary stats for the stats bar."""
    from datetime import datetime
    now = datetime.utcnow().timestamp()

    if not _cache["stocks"] or not _cache_time["stocks"] or \
       (now - _cache_time["stocks"]) > CACHE_TTL:
        signals = await get_live_signals("stocks")
        _cache["stocks"] = signals
        _cache_time["stocks"] = now

    signals = _cache["stocks"] or []
    buy_signals  = [s for s in signals if s["signal"] == "BUY"]
    hold_signals = [s for s in signals if s["signal"] == "HOLD"]
    sell_signals = [s for s in signals if s["signal"] == "SELL"]
    avg_conf = round(
        sum(s["confidence"] for s in signals) / len(signals) * 100, 1
    ) if signals else 0

    return {
        "buy_count":  len(buy_signals),
        "hold_count": len(hold_signals),
        "sell_count": len(sell_signals),
        "avg_confidence": avg_conf,
        "total": len(signals),
    }
