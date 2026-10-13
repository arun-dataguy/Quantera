from fastapi import APIRouter, Depends, HTTPException, Query
from app.routers.auth import get_current_user, PLAN_RANK
from app.models.user import User
from datetime import datetime, timezone
import asyncio

router = APIRouter()

_cache = {"stocks": None, "crypto": None}
_cache_time = {"stocks": None, "crypto": None}
CACHE_TTL = 1800

MOCK_STOCKS = [
    # Core — full sentiment + technical
    {"symbol": "AAPL",  "name": "Apple",            "signal": "BUY",  "confidence": 0.71, "price": 196.98, "change_pct":  1.19, "sentiment_score":  0.167, "technical_score": -0.056, "is_core": True,  "market": "stocks"},
    {"symbol": "NVDA",  "name": "NVIDIA",            "signal": "HOLD", "confidence": 0.46, "price": 103.32, "change_pct": -0.22, "sentiment_score":  0.220, "technical_score": -0.004, "is_core": True,  "market": "stocks"},
    {"symbol": "META",  "name": "Meta",              "signal": "BUY",  "confidence": 0.82, "price": 554.01, "change_pct": -0.07, "sentiment_score":  0.119, "technical_score":  0.094, "is_core": True,  "market": "stocks"},
    {"symbol": "MSFT",  "name": "Microsoft",         "signal": "HOLD", "confidence": 0.75, "price": 374.39, "change_pct":  0.02, "sentiment_score":  0.606, "technical_score": -0.148, "is_core": True,  "market": "stocks"},
    {"symbol": "AMZN",  "name": "Amazon",            "signal": "BUY",  "confidence": 0.54, "price": 184.72, "change_pct": -0.06, "sentiment_score":  0.527, "technical_score": -0.022, "is_core": True,  "market": "stocks"},
    {"symbol": "GOOGL", "name": "Alphabet",          "signal": "HOLD", "confidence": 0.61, "price": 155.45, "change_pct": -0.03, "sentiment_score":  0.053, "technical_score":  0.012, "is_core": True,  "market": "stocks"},
    {"symbol": "TSLA",  "name": "Tesla",             "signal": "SELL", "confidence": 0.62, "price": 249.98, "change_pct": -2.41, "sentiment_score": -0.133, "technical_score": -0.189, "is_core": True,  "market": "stocks"},
    {"symbol": "JPM",   "name": "JPMorgan",          "signal": "BUY",  "confidence": 0.68, "price": 224.11, "change_pct":  0.03, "sentiment_score":  0.143, "technical_score":  0.076, "is_core": True,  "market": "stocks"},
    # Extended — technical only
    {"symbol": "AVGO",  "name": "Broadcom",          "signal": "BUY",  "confidence": 0.73, "price": 185.43, "change_pct":  0.88, "sentiment_score": 0.0, "technical_score":  0.081, "is_core": False, "market": "stocks"},
    {"symbol": "ORCL",  "name": "Oracle",            "signal": "HOLD", "confidence": 0.59, "price": 154.22, "change_pct": -0.14, "sentiment_score": 0.0, "technical_score": -0.028, "is_core": False, "market": "stocks"},
    {"symbol": "CRM",   "name": "Salesforce",        "signal": "BUY",  "confidence": 0.65, "price": 271.90, "change_pct":  0.61, "sentiment_score": 0.0, "technical_score":  0.062, "is_core": False, "market": "stocks"},
    {"symbol": "NFLX",  "name": "Netflix",           "signal": "BUY",  "confidence": 0.78, "price": 923.15, "change_pct":  1.42, "sentiment_score": 0.0, "technical_score":  0.114, "is_core": False, "market": "stocks"},
    {"symbol": "AMD",   "name": "AMD",               "signal": "HOLD", "confidence": 0.44, "price":  97.64, "change_pct": -0.33, "sentiment_score": 0.0, "technical_score": -0.041, "is_core": False, "market": "stocks"},
    {"symbol": "INTC",  "name": "Intel",             "signal": "SELL", "confidence": 0.61, "price":  19.88, "change_pct": -1.72, "sentiment_score": 0.0, "technical_score": -0.132, "is_core": False, "market": "stocks"},
    {"symbol": "QCOM",  "name": "Qualcomm",          "signal": "HOLD", "confidence": 0.55, "price": 148.77, "change_pct": -0.08, "sentiment_score": 0.0, "technical_score": -0.012, "is_core": False, "market": "stocks"},
    {"symbol": "ADBE",  "name": "Adobe",             "signal": "HOLD", "confidence": 0.50, "price": 369.42, "change_pct":  0.21, "sentiment_score": 0.0, "technical_score":  0.004, "is_core": False, "market": "stocks"},
    {"symbol": "NOW",   "name": "ServiceNow",        "signal": "BUY",  "confidence": 0.69, "price": 897.50, "change_pct":  0.74, "sentiment_score": 0.0, "technical_score":  0.074, "is_core": False, "market": "stocks"},
    {"symbol": "INTU",  "name": "Intuit",            "signal": "HOLD", "confidence": 0.53, "price": 598.20, "change_pct": -0.19, "sentiment_score": 0.0, "technical_score": -0.018, "is_core": False, "market": "stocks"},
    {"symbol": "V",     "name": "Visa",              "signal": "BUY",  "confidence": 0.76, "price": 315.88, "change_pct":  0.55, "sentiment_score": 0.0, "technical_score":  0.093, "is_core": False, "market": "stocks"},
    {"symbol": "MA",    "name": "Mastercard",        "signal": "BUY",  "confidence": 0.74, "price": 499.63, "change_pct":  0.47, "sentiment_score": 0.0, "technical_score":  0.087, "is_core": False, "market": "stocks"},
    {"symbol": "BAC",   "name": "Bank of America",   "signal": "HOLD", "confidence": 0.58, "price":  36.82, "change_pct": -0.27, "sentiment_score": 0.0, "technical_score": -0.024, "is_core": False, "market": "stocks"},
    {"symbol": "WFC",   "name": "Wells Fargo",       "signal": "HOLD", "confidence": 0.60, "price":  56.14, "change_pct":  0.11, "sentiment_score": 0.0, "technical_score":  0.009, "is_core": False, "market": "stocks"},
    {"symbol": "GS",    "name": "Goldman Sachs",     "signal": "BUY",  "confidence": 0.67, "price": 491.37, "change_pct":  0.39, "sentiment_score": 0.0, "technical_score":  0.065, "is_core": False, "market": "stocks"},
    {"symbol": "MS",    "name": "Morgan Stanley",    "signal": "HOLD", "confidence": 0.56, "price": 104.22, "change_pct": -0.12, "sentiment_score": 0.0, "technical_score": -0.008, "is_core": False, "market": "stocks"},
    {"symbol": "BLK",   "name": "BlackRock",         "signal": "BUY",  "confidence": 0.70, "price": 875.66, "change_pct":  0.66, "sentiment_score": 0.0, "technical_score":  0.072, "is_core": False, "market": "stocks"},
    {"symbol": "UNH",   "name": "UnitedHealth",      "signal": "SELL", "confidence": 0.64, "price": 426.10, "change_pct": -1.38, "sentiment_score": 0.0, "technical_score": -0.118, "is_core": False, "market": "stocks"},
    {"symbol": "JNJ",   "name": "J&J",               "signal": "HOLD", "confidence": 0.57, "price": 152.33, "change_pct":  0.04, "sentiment_score": 0.0, "technical_score":  0.003, "is_core": False, "market": "stocks"},
    {"symbol": "LLY",   "name": "Eli Lilly",         "signal": "BUY",  "confidence": 0.71, "price": 797.44, "change_pct":  1.02, "sentiment_score": 0.0, "technical_score":  0.079, "is_core": False, "market": "stocks"},
    {"symbol": "ABBV",  "name": "AbbVie",            "signal": "BUY",  "confidence": 0.66, "price": 191.17, "change_pct":  0.58, "sentiment_score": 0.0, "technical_score":  0.061, "is_core": False, "market": "stocks"},
    {"symbol": "MRK",   "name": "Merck",             "signal": "HOLD", "confidence": 0.52, "price":  84.97, "change_pct": -0.18, "sentiment_score": 0.0, "technical_score": -0.015, "is_core": False, "market": "stocks"},
    {"symbol": "WMT",   "name": "Walmart",           "signal": "BUY",  "confidence": 0.72, "price":  90.31, "change_pct":  0.69, "sentiment_score": 0.0, "technical_score":  0.083, "is_core": False, "market": "stocks"},
    {"symbol": "COST",  "name": "Costco",            "signal": "BUY",  "confidence": 0.75, "price": 897.22, "change_pct":  0.81, "sentiment_score": 0.0, "technical_score":  0.096, "is_core": False, "market": "stocks"},
    {"symbol": "MCD",   "name": "McDonald's",        "signal": "HOLD", "confidence": 0.58, "price": 289.44, "change_pct": -0.09, "sentiment_score": 0.0, "technical_score": -0.006, "is_core": False, "market": "stocks"},
    {"symbol": "NKE",   "name": "Nike",              "signal": "SELL", "confidence": 0.63, "price":  56.28, "change_pct": -1.19, "sentiment_score": 0.0, "technical_score": -0.109, "is_core": False, "market": "stocks"},
    {"symbol": "HD",    "name": "Home Depot",        "signal": "HOLD", "confidence": 0.55, "price": 341.18, "change_pct":  0.08, "sentiment_score": 0.0, "technical_score":  0.006, "is_core": False, "market": "stocks"},
    {"symbol": "DIS",   "name": "Disney",            "signal": "HOLD", "confidence": 0.49, "price":  88.77, "change_pct": -0.31, "sentiment_score": 0.0, "technical_score": -0.032, "is_core": False, "market": "stocks"},
    {"symbol": "XOM",   "name": "Exxon",             "signal": "HOLD", "confidence": 0.60, "price": 103.44, "change_pct":  0.14, "sentiment_score": 0.0, "technical_score":  0.011, "is_core": False, "market": "stocks"},
    {"symbol": "CVX",   "name": "Chevron",           "signal": "HOLD", "confidence": 0.56, "price": 144.28, "change_pct": -0.22, "sentiment_score": 0.0, "technical_score": -0.017, "is_core": False, "market": "stocks"},
    {"symbol": "NEE",   "name": "NextEra",           "signal": "BUY",  "confidence": 0.64, "price":  67.19, "change_pct":  0.42, "sentiment_score": 0.0, "technical_score":  0.058, "is_core": False, "market": "stocks"},
    {"symbol": "GE",    "name": "GE Aerospace",      "signal": "BUY",  "confidence": 0.69, "price": 191.05, "change_pct":  0.77, "sentiment_score": 0.0, "technical_score":  0.076, "is_core": False, "market": "stocks"},
    {"symbol": "CAT",   "name": "Caterpillar",       "signal": "HOLD", "confidence": 0.54, "price": 307.91, "change_pct": -0.13, "sentiment_score": 0.0, "technical_score": -0.009, "is_core": False, "market": "stocks"},
    {"symbol": "HON",   "name": "Honeywell",         "signal": "HOLD", "confidence": 0.57, "price": 192.44, "change_pct":  0.06, "sentiment_score": 0.0, "technical_score":  0.004, "is_core": False, "market": "stocks"},
    {"symbol": "BRK-B", "name": "Berkshire",         "signal": "BUY",  "confidence": 0.67, "price": 497.81, "change_pct":  0.53, "sentiment_score": 0.0, "technical_score":  0.063, "is_core": False, "market": "stocks"},
    {"symbol": "PG",    "name": "P&G",               "signal": "HOLD", "confidence": 0.61, "price": 160.78, "change_pct":  0.07, "sentiment_score": 0.0, "technical_score":  0.005, "is_core": False, "market": "stocks"},
    {"symbol": "PEP",   "name": "PepsiCo",           "signal": "HOLD", "confidence": 0.55, "price": 134.61, "change_pct": -0.16, "sentiment_score": 0.0, "technical_score": -0.013, "is_core": False, "market": "stocks"},
    {"symbol": "KO",    "name": "Coca-Cola",         "signal": "HOLD", "confidence": 0.58, "price":  68.44, "change_pct":  0.09, "sentiment_score": 0.0, "technical_score":  0.007, "is_core": False, "market": "stocks"},
    {"symbol": "ACN",   "name": "Accenture",         "signal": "HOLD", "confidence": 0.53, "price": 278.33, "change_pct": -0.11, "sentiment_score": 0.0, "technical_score": -0.007, "is_core": False, "market": "stocks"},
    {"symbol": "IBM",   "name": "IBM",               "signal": "BUY",  "confidence": 0.66, "price": 231.47, "change_pct":  0.49, "sentiment_score": 0.0, "technical_score":  0.060, "is_core": False, "market": "stocks"},
    {"symbol": "PLTR",  "name": "Palantir",          "signal": "BUY",  "confidence": 0.74, "price":  87.55, "change_pct":  1.33, "sentiment_score": 0.0, "technical_score":  0.102, "is_core": False, "market": "stocks"},
    {"symbol": "UBER",  "name": "Uber",              "signal": "BUY",  "confidence": 0.68, "price":  68.41, "change_pct":  0.64, "sentiment_score": 0.0, "technical_score":  0.070, "is_core": False, "market": "stocks"},
    {"symbol": "SHOP",  "name": "Shopify",           "signal": "HOLD", "confidence": 0.51, "price":  82.17, "change_pct": -0.24, "sentiment_score": 0.0, "technical_score": -0.021, "is_core": False, "market": "stocks"},
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


def _user_plan(user: User) -> str:
    return user.plan.value if user.plan else "free"


def _mask_signal(s: dict) -> dict:
    """Return a copy with gated fields hidden for free-tier users."""
    return {**s, "confidence": None, "sentiment_score": None, "gated": True}


@router.get("/latest")
async def get_signals(
    market: str = Query("stocks", enum=["stocks", "crypto"]),
    current_user: User = Depends(get_current_user),
):
    plan = _user_plan(current_user)
    rank = PLAN_RANK.get(plan, 0)

    if market == "crypto" and rank < PLAN_RANK["premium"]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "plan_required",
                "required_plan": "premium",
                "current_plan": plan,
                "message": "Upgrade to Premium to access crypto signals.",
            },
        )

    now = datetime.now(timezone.utc).timestamp()
    if _cache[market] and _cache_time[market]:
        age = now - _cache_time[market]
        if age < CACHE_TTL:
            signals = _cache[market]
            return _build_response(signals, market, plan, rank, cached=True)

    signals, is_mock = await fetch_signals_safe(market)
    _cache[market] = signals
    _cache_time[market] = now
    return _build_response(signals, market, plan, rank, cached=False, is_mock=is_mock)


def _build_response(signals, market, plan, rank, *, cached, is_mock=False):
    if market == "stocks" and rank < PLAN_RANK["pro"]:
        core = [s for s in signals if s.get("is_core")][:5]
        masked = [_mask_signal(s) for s in core]
        return {
            "signals": masked,
            "cached": cached,
            "market": market,
            "total": len(masked),
            "gated": True,
            "required_plan": "pro",
        }
    return {
        "signals": signals,
        "cached": cached,
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
