import asyncio
import numpy as np
import yfinance as yf
from typing import List, Dict

from app.services.signal_engine import generate_signal, CORE_STOCKS, EXTENDED_STOCKS

LOOKBACK = 60   # days of history required to generate a signal
HORIZONS = [1, 5, 10]


def _signal_at(closes: np.ndarray, idx: int) -> Dict:
    """Replicate the live signal algorithm on a historical window."""
    window = closes[idx - LOOKBACK:idx]
    if len(window) < 26:
        return {"signal": "HOLD", "confidence": 0.0, "technical_score": 0.0}

    # RSI (14)
    delta = np.diff(window)
    gains  = np.where(delta > 0, delta, 0.0)
    losses = np.where(delta < 0, -delta, 0.0)
    avg_gain = float(np.mean(gains[-14:]))
    avg_loss = float(np.mean(losses[-14:]))
    rsi = 100.0 - (100.0 / (1 + avg_gain / avg_loss)) if avg_loss > 0 else 50.0

    # MACD (simplified 12/26 SMA)
    ema12 = float(np.mean(window[-12:]))
    ema26 = float(np.mean(window[-26:]))
    macd  = (ema12 - ema26) / ema26

    # SMA20 trend
    sma20      = float(np.mean(window[-20:])) if len(window) >= 20 else window[-1]
    sma_score  = (window[-1] - sma20) / sma20

    technical  = round((((rsi - 50) / 100) + macd + sma_score) / 3, 4)

    returns    = np.diff(window) / window[:-1]
    volatility = float(np.std(returns)) if len(returns) > 1 else 0.02
    conf_base  = max(0.40, 0.80 - volatility * 5)

    sig = generate_signal(0.0, technical, conf_base, is_core=False)
    return {"signal": sig["signal"], "confidence": sig["confidence"], "technical_score": technical}


def run_backtest(symbol: str, period: str = "1y") -> Dict:
    """
    Walk-forward backtest: generate a signal at every trading day, then
    measure 1/5/10-day forward returns against those signals.

    Sentiment is excluded — historical NewsAPI data is unavailable, so this
    is a pure technical backtest even for core stocks.
    """
    try:
        hist = yf.Ticker(symbol).history(period=period, interval="1d")
        if hist is None or hist.empty:
            return {"error": f"No data for {symbol}", "symbol": symbol}

        closes = hist["Close"].values.flatten().astype(float)
        dates  = [str(d.date()) for d in hist.index]
        n      = len(closes)

        if n < LOOKBACK + max(HORIZONS) + 1:
            return {"error": f"Insufficient history for {symbol} ({n} days)", "symbol": symbol}

        signals_out = []
        for i in range(LOOKBACK, n - max(HORIZONS)):
            sig  = _signal_at(closes, i)
            entry = closes[i]

            fwd = {h: round((closes[i + h] - entry) / entry, 5) for h in HORIZONS}

            correct = {}
            for h in HORIZONS:
                if sig["signal"] == "BUY":
                    correct[h] = fwd[h] > 0
                elif sig["signal"] == "SELL":
                    correct[h] = fwd[h] < 0
                else:
                    correct[h] = None  # HOLD — excluded from accuracy

            signals_out.append({
                "date":            dates[i],
                "signal":          sig["signal"],
                "confidence":      sig["confidence"],
                "technical_score": sig["technical_score"],
                "price":           round(entry, 2),
                "return_1d":       fwd[1],
                "return_5d":       fwd[5],
                "return_10d":      fwd[10],
                "correct_1d":      correct[1],
                "correct_5d":      correct[5],
                "correct_10d":     correct[10],
            })

        buy_sigs  = [s for s in signals_out if s["signal"] == "BUY"]
        sell_sigs = [s for s in signals_out if s["signal"] == "SELL"]
        hold_sigs = [s for s in signals_out if s["signal"] == "HOLD"]
        actionable = buy_sigs + sell_sigs

        def _acc(sigs, hkey):
            valid = [s for s in sigs if s[f"correct_{hkey}"] is not None]
            if not valid:
                return None
            return round(sum(1 for s in valid if s[f"correct_{hkey}"]) / len(valid), 3)

        def _avg_ret(sigs, hkey):
            if not sigs:
                return None
            return round(float(np.mean([s[f"return_{hkey}"] for s in sigs])) * 100, 2)

        # Equity curve — compound returns from every BUY signal in sequence
        cumulative = 1.0
        equity = [1.0]
        for s in buy_sigs:
            cumulative = round(cumulative * (1 + s["return_5d"]), 5)
            equity.append(cumulative)

        # Max drawdown on equity curve
        peak   = equity[0]
        max_dd = 0.0
        for v in equity:
            if v > peak:
                peak = v
            dd = (peak - v) / peak
            if dd > max_dd:
                max_dd = dd

        # Downsample to ≤100 points for the chart
        step = max(1, len(equity) // 100)
        equity_ds = equity[::step]
        if equity_ds[-1] != equity[-1]:
            equity_ds.append(equity[-1])

        return {
            "symbol":             symbol,
            "period":             period,
            "data_days":          n,
            "total_signals":      len(signals_out),
            "buy_signals":        len(buy_sigs),
            "sell_signals":       len(sell_sigs),
            "hold_signals":       len(hold_sigs),
            "actionable_signals": len(actionable),
            # Accuracy by horizon
            "overall_accuracy_5d":  _acc(actionable, "5d"),
            "buy_accuracy_1d":   _acc(buy_sigs,  "1d"),
            "buy_accuracy_5d":   _acc(buy_sigs,  "5d"),
            "buy_accuracy_10d":  _acc(buy_sigs,  "10d"),
            "sell_accuracy_1d":  _acc(sell_sigs, "1d"),
            "sell_accuracy_5d":  _acc(sell_sigs, "5d"),
            "sell_accuracy_10d": _acc(sell_sigs, "10d"),
            # Average returns (%)
            "avg_buy_return_5d":  _avg_ret(buy_sigs,  "5d"),
            "avg_sell_return_5d": _avg_ret(sell_sigs, "5d"),
            # Equity / drawdown
            "final_return_pct":  round((cumulative - 1) * 100, 2),
            "max_drawdown_pct":  round(max_dd * 100, 2),
            "equity_curve":      equity_ds,
            # Last 30 actionable signals for the log
            "recent_signals": [s for s in signals_out if s["signal"] != "HOLD"][-30:],
        }
    except Exception as e:
        return {"error": str(e), "symbol": symbol}


async def run_backtest_async(symbol: str, period: str = "1y") -> Dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, run_backtest, symbol, period)


async def run_multi_backtest(symbols: List[str], period: str = "1y") -> Dict:
    """Run backtests for all symbols in parallel, return summary + per-symbol."""
    results = await asyncio.gather(
        *[run_backtest_async(sym, period) for sym in symbols],
        return_exceptions=True,
    )

    by_symbol: Dict = {}
    total_actionable = 0
    weighted_acc     = 0.0
    buy_returns: List[float] = []

    for sym, res in zip(symbols, results):
        if isinstance(res, Exception):
            by_symbol[sym] = {"error": str(res), "symbol": sym}
            continue
        by_symbol[sym] = res
        if "error" in res:
            continue
        act = res.get("actionable_signals", 0)
        acc = res.get("overall_accuracy_5d")
        if acc is not None and act > 0:
            total_actionable += act
            weighted_acc     += acc * act
        if res.get("avg_buy_return_5d") is not None:
            buy_returns.append(res["avg_buy_return_5d"])

    overall_acc = round(weighted_acc / total_actionable, 3) if total_actionable > 0 else None
    total_sigs  = sum(
        v.get("total_signals", 0) for v in by_symbol.values() if "error" not in v
    )

    return {
        "period":      period,
        "symbols_run": sum(1 for v in by_symbol.values() if "error" not in v),
        "summary": {
            "overall_accuracy_5d": overall_acc,
            "total_signals":       total_sigs,
            "total_actionable":    total_actionable,
            "avg_buy_return_5d":   round(float(np.mean(buy_returns)), 2) if buy_returns else None,
        },
        "by_symbol": by_symbol,
    }
