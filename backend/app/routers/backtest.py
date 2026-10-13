import time
from fastapi import APIRouter, Depends, Query
from app.routers.auth import get_current_user
from app.models.user import User
from app.services.backtest_engine import run_backtest_async, run_multi_backtest
from app.services.signal_engine import CORE_STOCKS, EXTENDED_STOCKS

router = APIRouter()

_cache: dict = {}
_cache_ts: dict = {}
CACHE_TTL = 6 * 3600  # 6 hours — backtests are slow/expensive to rerun


@router.get("/run")
async def backtest_single(
    symbol: str = Query(..., description="Ticker e.g. AAPL"),
    period: str = Query("1y", enum=["3mo", "6mo", "1y", "2y"]),
    current_user: User = Depends(get_current_user),
):
    key = f"{symbol.upper()}:{period}"
    now = time.time()
    if key in _cache and (now - _cache_ts.get(key, 0)) < CACHE_TTL:
        return {**_cache[key], "cached": True}

    result = await run_backtest_async(symbol.upper(), period)
    if "error" not in result:
        _cache[key]    = result
        _cache_ts[key] = now

    return {**result, "cached": False}


@router.get("/summary")
async def backtest_summary(
    period: str = Query("1y", enum=["3mo", "6mo", "1y", "2y"]),
    market: str = Query("core", enum=["core", "extended"]),
    current_user: User = Depends(get_current_user),
):
    symbols = CORE_STOCKS if market == "core" else CORE_STOCKS + EXTENDED_STOCKS[:10]
    key = f"summary:{market}:{period}"
    now = time.time()
    if key in _cache and (now - _cache_ts.get(key, 0)) < CACHE_TTL:
        return {**_cache[key], "cached": True}

    result = await run_multi_backtest(symbols, period)
    _cache[key]    = result
    _cache_ts[key] = now
    return {**result, "cached": False}
