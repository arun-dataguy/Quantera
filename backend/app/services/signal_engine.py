import yfinance as yf
import requests
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import os

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "ac418135e878478494b847ea5e9bf2b5")

WATCHLIST = {
    "stocks": ["AAPL", "NVDA", "META", "MSFT", "AMZN", "GOOGL", "TSLA", "JPM"],
    "crypto": ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD", "ADA-USD"],
}

CRYPTO_DISPLAY = {
    "BTC-USD": "BTC", "ETH-USD": "ETH", "SOL-USD": "SOL",
    "BNB-USD": "BNB", "XRP-USD": "XRP", "ADA-USD": "ADA",
}


def get_sentiment_score(symbol: str) -> float:
    """Fetch real NewsAPI sentiment for a symbol."""
    try:
        query = symbol.replace("-USD", "")
        name_map = {
            "AAPL": "Apple", "NVDA": "Nvidia", "META": "Meta",
            "MSFT": "Microsoft", "AMZN": "Amazon", "GOOGL": "Google",
            "TSLA": "Tesla", "JPM": "JPMorgan", "BTC": "Bitcoin",
            "ETH": "Ethereum", "SOL": "Solana", "BNB": "Binance",
            "XRP": "Ripple", "ADA": "Cardano",
        }
        name = name_map.get(query, query)
        url = (
            f"https://newsapi.org/v2/everything"
            f"?q={name}+stock+OR+{query}&language=en"
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
            b = sum(1 for w in BULL if w in text)
            br = sum(1 for w in BEAR if w in text)
            score += (b - br) * 0.1
        return round(max(-1.0, min(1.0, score / len(articles))), 3)
    except Exception:
        return 0.0


def compute_technical_score(hist) -> float:
    """RSI + MACD momentum score."""
    try:
        closes = hist["Close"].values.flatten().astype(float)
        if len(closes) < 26:
            return 0.0

        # RSI
        delta = np.diff(closes)
        gains = np.where(delta > 0, delta, 0)
        losses = np.where(delta < 0, -delta, 0)
        avg_gain = np.mean(gains[-14:])
        avg_loss = np.mean(losses[-14:])
        rsi = 100 - (100 / (1 + avg_gain / avg_loss)) if avg_loss > 0 else 50

        # MACD
        ema12 = float(np.mean(closes[-12:]))
        ema26 = float(np.mean(closes[-26:]))
        macd = (ema12 - ema26) / ema26

        # Combine: RSI normalised + MACD
        rsi_score = (rsi - 50) / 100
        return round((rsi_score + macd) / 2, 3)
    except Exception:
        return 0.0


def generate_signal(sentiment: float, technical: float, conf_base: float) -> Dict:
    """Combine scores into BUY/HOLD/SELL with confidence."""
    combined = (sentiment * 0.4) + (technical * 0.6)
    confidence = round(min(0.95, max(0.3, conf_base + abs(combined) * 0.3)), 3)

    if combined > 0.05:
        signal = "BUY"
    elif combined < -0.05:
        signal = "SELL"
    else:
        signal = "HOLD"

    return {"signal": signal, "confidence": confidence, "combined_score": combined}


async def get_live_signals(market: str = "stocks") -> List[Dict]:
    """Main function — returns live signals for all symbols."""
    symbols = WATCHLIST.get(market, WATCHLIST["stocks"])
    results = []

    for sym in symbols:
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="30d", interval="1d")
            if hist.empty:
                continue

            # Current price
            price = float(hist["Close"].iloc[-1])
            prev_price = float(hist["Close"].iloc[-2]) if len(hist) > 1 else price
            change_pct = round(((price - prev_price) / prev_price) * 100, 2)

            # Scores
            display_sym = CRYPTO_DISPLAY.get(sym, sym)
            sentiment = get_sentiment_score(display_sym)
            technical = compute_technical_score(hist)

            # 30-day volatility for confidence base
            returns = hist["Close"].pct_change().dropna()
            volatility = float(returns.std()) if len(returns) > 1 else 0.02
            conf_base = max(0.4, 0.8 - volatility * 5)

            sig = generate_signal(sentiment, technical, conf_base)

            results.append({
                "symbol":          display_sym,
                "full_symbol":     sym,
                "signal":          sig["signal"],
                "confidence":      sig["confidence"],
                "price":           round(price, 2),
                "change_pct":      change_pct,
                "sentiment_score": sentiment,
                "technical_score": technical,
                "market":          market,
                "generated_at":    datetime.utcnow().isoformat() + "Z",
            })
        except Exception as e:
            print(f"⚠️ Signal error for {sym}: {e}")
            continue

    # Sort: BUY first, then by confidence
    results.sort(key=lambda x: (x["signal"] != "BUY", -x["confidence"]))
    return results
