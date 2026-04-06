from fastapi import APIRouter, Depends, Query
from app.routers.auth import get_current_user
from app.models.user import User
from fastapi import HTTPException
from datetime import datetime, timezone
import asyncio

router = APIRouter()

_cache = {"stocks": None, "crypto": None}
_cache_time = {"stocks": None, "crypto": None}
CACHE_TTL = 1800

MOCK_STOCKS = [
    {"symbol": "AAPL",  "signal": "BUY",  "confidence": 0.71, "price": 258.97, "change_pct": 1.19,  "sentiment_score": 0.167,  "technical_score": -0.056, "market": "stocks"},
    {"symbol": "NVDA",  "signal": "HOLD", "confidence": 0.46, "price": 176.95, "change_pct": -0.22, "sentiment_score": 0.220,  "technical_score": -0.004, "market": "stocks"},
    {"symbol": "META",  "signal": "BUY",  "confidence": 0.90, "price": 579.05, "change_pct": -0.07, "sentiment_score": 0.119,  "technical_score": -0.184, "market": "stocks"},
    {"symbol": "MSFT",  "signal": "HOLD", "confidence": 0.75, "price": 372.62, "change_pct": 0.02,  "sentiment_score": 0.606,  "technical_score": -0.148, "market": "stocks"},
    {"symbol": "AMZN",  "signal": "BUY",  "confidence": 0.54, "price": 211.88, "change_pct": -0.06, "sentiment_score": 0.527,  "technical_score": -0.022, "market": "stocks"},
    {"symbol": "GOOGL", "signal": "HOLD", "confidence": 0.61, "price": 297.93, "change_pct": -0.03, "sentiment_score": 0.053,  "technical_score": 0.012,  "market": "stocks"},
    {"symbol": "TSLA",  "signal": "HOLD", "confidence": 0.52, "price": 363.94, "change_pct": -0.06, "sentiment_score": -0.033, "technical_score": -0.089, "market": "stocks"},
    {"symbol": "JPM",   "signal": "BUY",  "confidence": 0.68, "price": 295.34, "change_pct": 0.03,  "sentiment_score": 0.143,  "technical_score": 0.076,  "market": "stocks"},
]

MOCK_CRYPTO = [
    {"symbol": "BTC",  "signal": "BUY",  "confidence": 0.78, "price": 83241.00, "change_pct": 3.42,  "sentiment_score": 0.312, "technical_score": 0.124,  "market": "crypto"},
    {"symbol": "ETH",  "signal": "BUY",  "confidence": 0.71, "price": 1812.00,  "change_pct": 1.85,  "sentiment_score": 0.287, "technical_score": 0.098,  "market": "crypto"},
    {"symbol": "SOL",  "signal": "HOLD", "confidence": 0.51, "price": 124.50,   "change_pct": -0.12, "sentiment_score": 0.145, "technical_score": -0.032, "market": "crypto"},
    {"symbol": "BNB",  "signal": "SELL", "confidence": 0.68, "price": 592.41,   "change_pct": -2.11, "sentiment_score": -0.198,"technical_score": -0.187, "market": "crypto"},
    {"symbol": "XRP",  "signal": "HOLD", "confidence": 0.49, "price": 2.14,     "change_pct": -0.54, "sentiment_score": -0.087,"technical_score": -0.054, "market": "crypto"},
    {"symbol": "ADA",  "signal": "HOLD", "confidence": 0.43, "price": 0.724,    "change_pct": -1.02, "sentiment_score": 0.032, "technical_score": -0.098, "market": "crypto"},
]


async def fetch_signals_safe(market: str):
    """Try live signals, fall back to mock if anything fails."""
    try:
        from app.services.signal_engine import get_live_signals
        signals = await asyncio.wait_for(
            get_live_signals(market),
            timeout=25.0
        )
        if signals:
            return signals, False
    except Exception as e:
        print(f"⚠️ Live signals failed, using mock: {e}")

    mock = MOCK_STOCKS if market == "stocks" else MOCK_CRYPTO
    ts = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return [{**s, "generated_at": ts} for s in mock], True


@router.get("/latest")
async def get_signals(
    market: str = Query("stocks", enum=["stocks", "crypto"]),
    current_user: User = Depends(get_current_user),
):
    # Beta mode — all plans get full access
    now = datetime.now(timezone.utc).timestamp()
    if _cache[market] and _cache_time[market]:
        age = now - _cache_time[market]
        if age < CACHE_TTL:
            return {"signals": _cache[market], "cached": True, "market": market}

    signals, is_mock = await fetch_signals_safe(market)
    _cache[market] = signals
    _cache_time[market] = now

    return {
        "signals": signals,
        "cached": False,
        "is_mock": is_mock,
        "market": market,
        "total": len(signals),
    }


@router.get("/latest/public")
async def get_public_signals():
    """Public endpoint — 3 signals for landing page."""
    now = datetime.now(timezone.utc).timestamp()
    if _cache["stocks"] and _cache_time["stocks"]:
        if (now - _cache_time["stocks"]) < CACHE_TTL:
            return {"signals": _cache["stocks"][:3], "market": "stocks"}

    signals, _ = await fetch_signals_safe("stocks")
    _cache["stocks"] = signals
    _cache_time["stocks"] = now
    return {"signals": signals[:3], "market": "stocks"}


@router.get("/stats")
async def get_signal_stats(_current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc).timestamp()
    if not _cache["stocks"] or not _cache_time["stocks"] or \
       (now - _cache_time["stocks"]) > CACHE_TTL:
        signals, _ = await fetch_signals_safe("stocks")
        _cache["stocks"] = signals
        _cache_time["stocks"] = now

    signals = _cache["stocks"] or []
    buy  = [s for s in signals if s["signal"] == "BUY"]
    hold = [s for s in signals if s["signal"] == "HOLD"]
    sell = [s for s in signals if s["signal"] == "SELL"]
    avg  = round(sum(s["confidence"] for s in signals) / len(signals) * 100, 1) if signals else 0

    return {
        "buy_count": len(buy),
        "hold_count": len(hold),
        "sell_count": len(sell),
        "avg_confidence": avg,
        "total": len(signals),
    }
