import asyncio
import yfinance as yf
import requests
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import os

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "ac418135e878478494b847ea5e9bf2b5")

# ── Core stocks: full LSTM+LightGBM+Sentiment pipeline ───────────────────────
CORE_STOCKS = ["AAPL", "NVDA", "META", "MSFT", "AMZN", "GOOGL", "TSLA", "JPM"]

# ── Extended: top S&P 500 by market cap — technical-only signals ──────────────
EXTENDED_STOCKS = [
    # Mega cap tech
    "AVGO", "ORCL", "CRM", "NFLX", "AMD", "INTC", "QCOM", "ADBE", "NOW", "INTU",
    # Financials
    "V", "MA", "BAC", "WFC", "GS", "MS", "BLK", "SCHW", "AXP", "USB",
    # Healthcare
    "UNH", "JNJ", "LLY", "ABBV", "MRK", "TMO", "ABT", "AMGN", "ISRG", "BMY",
    # Consumer
    "WMT", "COST", "MCD", "NKE", "SBUX", "TGT", "LOW", "HD", "DIS", "CMCSA",
    # Energy/Industrial
    "XOM", "CVX", "NEE", "GE", "RTX", "UNP", "HON", "CAT", "DE", "LIN",
    # Other
    "BRK-B", "PG", "PEP", "KO", "PM", "ACN", "IBM", "PLTR", "UBER", "SHOP",
]

WATCHLIST = {
    "stocks": CORE_STOCKS + EXTENDED_STOCKS,
    "crypto": ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD", "ADA-USD", "DOGE-USD", "AVAX-USD"],
}

CRYPTO_DISPLAY = {
    "BTC-USD": "BTC", "ETH-USD": "ETH", "SOL-USD": "SOL",
    "BNB-USD": "BNB", "XRP-USD": "XRP", "ADA-USD": "ADA",
    "DOGE-USD": "DOGE", "AVAX-USD": "AVAX",
}

# Company names for display
NAMES = {
    "AAPL":"Apple","NVDA":"NVIDIA","META":"Meta","MSFT":"Microsoft","AMZN":"Amazon",
    "GOOGL":"Alphabet","TSLA":"Tesla","JPM":"JPMorgan","AVGO":"Broadcom","ORCL":"Oracle",
    "CRM":"Salesforce","NFLX":"Netflix","AMD":"AMD","INTC":"Intel","QCOM":"Qualcomm",
    "ADBE":"Adobe","NOW":"ServiceNow","INTU":"Intuit","V":"Visa","MA":"Mastercard",
    "BAC":"Bank of America","WFC":"Wells Fargo","GS":"Goldman Sachs","MS":"Morgan Stanley",
    "BLK":"BlackRock","SCHW":"Schwab","AXP":"Amex","USB":"US Bancorp",
    "UNH":"UnitedHealth","JNJ":"J&J","LLY":"Eli Lilly","ABBV":"AbbVie","MRK":"Merck",
    "TMO":"Thermo Fisher","ABT":"Abbott","AMGN":"Amgen","ISRG":"Intuitive Surgical",
    "BMY":"Bristol Myers","WMT":"Walmart","COST":"Costco","MCD":"McDonald's",
    "NKE":"Nike","SBUX":"Starbucks","TGT":"Target","LOW":"Lowe's","HD":"Home Depot",
    "DIS":"Disney","CMCSA":"Comcast","XOM":"Exxon","CVX":"Chevron","NEE":"NextEra",
    "GE":"GE Aerospace","RTX":"Raytheon","UNP":"Union Pacific","HON":"Honeywell",
    "CAT":"Caterpillar","DE":"John Deere","LIN":"Linde","BRK-B":"Berkshire",
    "PG":"P&G","PEP":"PepsiCo","KO":"Coca-Cola","PM":"Philip Morris",
    "ACN":"Accenture","IBM":"IBM","PLTR":"Palantir","UBER":"Uber","SHOP":"Shopify",
    "BTC":"Bitcoin","ETH":"Ethereum","SOL":"Solana","BNB":"BNB",
    "XRP":"XRP","ADA":"Cardano","DOGE":"Dogecoin","AVAX":"Avalanche",
}

# ── Sentiment (NewsAPI) — only for core stocks to conserve API quota ──────────
_sentiment_cache: dict = {}
_sentiment_time: dict = {}
SENTIMENT_TTL = 3600  # 1 hour


def get_sentiment_score(symbol: str) -> float:
    import time
    now = time.time()
    if symbol in _sentiment_cache and (now - _sentiment_time.get(symbol, 0)) < SENTIMENT_TTL:
        return _sentiment_cache[symbol]

    try:
        name_map = {
            "AAPL":"Apple","NVDA":"Nvidia","META":"Meta","MSFT":"Microsoft",
            "AMZN":"Amazon","GOOGL":"Google","TSLA":"Tesla","JPM":"JPMorgan",
            "BTC":"Bitcoin","ETH":"Ethereum","SOL":"Solana","BNB":"Binance",
            "XRP":"Ripple","ADA":"Cardano","DOGE":"Dogecoin","AVAX":"Avalanche",
        }
        clean = symbol.replace("-USD", "")
        name  = name_map.get(clean, clean)
        url = (
            f"https://newsapi.org/v2/everything"
            f"?q={name}+stock+OR+{clean}&language=en"
            f"&sortBy=publishedAt&pageSize=5&apiKey={NEWS_API_KEY}"
        )
        res = requests.get(url, timeout=5)
        articles = res.json().get("articles", [])
        if not articles:
            return 0.0

        BULL = ["surge","rally","record","gain","rise","growth","beat",
                "profit","bullish","upgrade","strong","high","boost","soar"]
        BEAR = ["crash","fall","drop","loss","recession","decline","risk",
                "sell","bearish","downgrade","weak","low","plunge","slump"]

        score = 0.0
        for a in articles:
            text = ((a.get("title") or "") + " " + (a.get("description") or "")).lower()
            b  = sum(1 for w in BULL if w in text)
            br = sum(1 for w in BEAR if w in text)
            score += (b - br) * 0.1
        result = round(max(-1.0, min(1.0, score / len(articles))), 3)
        _sentiment_cache[symbol] = result
        _sentiment_time[symbol]  = now
        return result
    except Exception:
        return 0.0


def compute_technical_score(hist) -> float:
    """RSI + MACD + SMA trend momentum score."""
    try:
        closes = hist["Close"].values.flatten().astype(float)
        if len(closes) < 26:
            return 0.0

        # RSI (14)
        delta = np.diff(closes)
        gains  = np.where(delta > 0, delta, 0)
        losses = np.where(delta < 0, -delta, 0)
        avg_gain = np.mean(gains[-14:])
        avg_loss = np.mean(losses[-14:])
        rsi = 100 - (100 / (1 + avg_gain / avg_loss)) if avg_loss > 0 else 50

        # MACD (12/26 EMA simplified)
        ema12 = float(np.mean(closes[-12:]))
        ema26 = float(np.mean(closes[-26:]))
        macd  = (ema12 - ema26) / ema26

        # SMA trend: price vs 20-day SMA
        sma20 = float(np.mean(closes[-20:])) if len(closes) >= 20 else closes[-1]
        sma_score = (closes[-1] - sma20) / sma20

        rsi_score = (rsi - 50) / 100
        return round((rsi_score + macd + sma_score) / 3, 3)
    except Exception:
        return 0.0


def generate_signal(sentiment: float, technical: float, conf_base: float, is_core: bool = True) -> Dict:
    """Combine scores into BUY/HOLD/SELL."""
    if is_core:
        combined = (sentiment * 0.4) + (technical * 0.6)
    else:
        combined = technical  # Extended stocks: technical only

    confidence = round(min(0.95, max(0.30, conf_base + abs(combined) * 0.3)), 3)

    if combined > 0.04:
        signal = "BUY"
    elif combined < -0.04:
        signal = "SELL"
    else:
        signal = "HOLD"

    return {"signal": signal, "confidence": confidence}


async def _fetch_one(sym: str, market: str, is_core: bool) -> Dict | None:
    """Fetch and score a single symbol. Run in executor to avoid blocking."""
    loop = asyncio.get_event_loop()
    try:
        def _sync():
            ticker = yf.Ticker(sym)
            hist   = ticker.history(period="60d", interval="1d")
            return hist
        hist = await asyncio.wait_for(
            loop.run_in_executor(None, _sync),
            timeout=15.0,
        )
        if hist is None or hist.empty:
            return None

        price      = float(hist["Close"].iloc[-1])
        prev_price = float(hist["Close"].iloc[-2]) if len(hist) > 1 else price
        change_pct = round(((price - prev_price) / prev_price) * 100, 2)

        display_sym = CRYPTO_DISPLAY.get(sym, sym)
        sentiment   = get_sentiment_score(display_sym) if is_core else 0.0
        technical   = compute_technical_score(hist)

        returns    = hist["Close"].pct_change().dropna()
        volatility = float(returns.std()) if len(returns) > 1 else 0.02
        conf_base  = max(0.40, 0.80 - volatility * 5)

        sig = generate_signal(sentiment, technical, conf_base, is_core)

        return {
            "symbol":          display_sym,
            "full_symbol":     sym,
            "name":            NAMES.get(display_sym, display_sym),
            "signal":          sig["signal"],
            "confidence":      sig["confidence"],
            "price":           round(price, 2),
            "change_pct":      change_pct,
            "sentiment_score": sentiment,
            "technical_score": technical,
            "is_core":         is_core,
            "market":          market,
            "generated_at":    datetime.utcnow().isoformat() + "Z",
        }
    except Exception as e:
        print(f"⚠️ Signal error {sym}: {e}")
        return None


async def get_live_signals(market: str = "stocks") -> List[Dict]:
    """Parallel signal fetch for all symbols."""
    symbols  = WATCHLIST.get(market, WATCHLIST["stocks"])
    core_set = set(CORE_STOCKS if market == "stocks" else [])

    tasks = [
        _fetch_one(sym, market, sym in core_set)
        for sym in symbols
    ]
    # Run all in parallel, cap total time at 40s
    raw = await asyncio.wait_for(
        asyncio.gather(*tasks, return_exceptions=True),
        timeout=40.0,
    )

    results = [r for r in raw if isinstance(r, dict)]
    results.sort(key=lambda x: (x["signal"] != "BUY", -x["confidence"]))
    return results
