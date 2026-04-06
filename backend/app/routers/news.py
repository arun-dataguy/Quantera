from fastapi import APIRouter, Query
import requests
import os
import time

router = APIRouter()

NEWS_API_KEY = os.getenv("NEWS_API_KEY", "ac418135e878478494b847ea5e9bf2b5")

QUERIES = {
    "Global":  "stock market OR Federal Reserve OR Wall Street OR trading OR earnings",
    "Crypto":  "Bitcoin OR Ethereum OR cryptocurrency OR crypto trading",
    "Stocks":  "AAPL OR NVDA OR Tesla OR Microsoft OR earnings report",
    "Forex":   "forex OR USD OR EUR OR interest rates OR currency exchange",
}

_cache = {}
_cache_time = {}
CACHE_TTL = 1800  # 30 minutes


@router.get("/feed")
async def get_news_feed(filter: str = Query("Global")):
    """Proxy NewsAPI through backend — fixes CORS on production."""
    now = time.time()

    # Return cached if fresh
    if filter in _cache and (now - _cache_time.get(filter, 0)) < CACHE_TTL:
        return _cache[filter]

    try:
        query = QUERIES.get(filter, QUERIES["Global"])
        res = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q":        query,
                "language": "en",
                "sortBy":   "publishedAt",
                "pageSize": 8,
                "apiKey":   NEWS_API_KEY,
            },
            timeout=10,
        )
        data = res.json()
        articles = data.get("articles", [])

        cleaned = [
            {
                "source":      (a.get("source") or {}).get("name", "NEWS"),
                "title":       (a.get("title") or "").replace(" - " + (a.get("source") or {}).get("name", ""), ""),
                "description": a.get("description") or "",
                "url":         a.get("url") or "",
                "image":       a.get("urlToImage"),
                "publishedAt": a.get("publishedAt") or "",
            }
            for a in articles
            if a.get("title") and "[Removed]" not in (a.get("title") or "")
        ]

        result = {"articles": cleaned, "filter": filter, "total": len(cleaned)}
        _cache[filter] = result
        _cache_time[filter] = now
        return result

    except Exception as e:
        print(f"NewsAPI error: {e}")
        return {"articles": _get_mock_news(), "filter": filter, "total": 4, "mock": True}


def _get_mock_news():
    return [
        {
            "source": "BLOOMBERG", "publishedAt": "2026-04-06T14:00:00Z",
            "title": "Federal Reserve Signals Potential Rate Cut in Q3 as Inflation Moderates",
            "description": "Chairman Jerome Powell noted the balance of risks is shifting towards economic growth support.",
            "url": "#", "image": None,
        },
        {
            "source": "REUTERS", "publishedAt": "2026-04-06T13:45:00Z",
            "title": "NVIDIA Reports Record Data Centre Revenue as AI Chip Demand Surges",
            "description": "The chipmaker posted quarterly data centre revenues exceeding analyst forecasts for the fifth consecutive quarter.",
            "url": "#", "image": None,
        },
        {
            "source": "CNBC", "publishedAt": "2026-04-06T13:30:00Z",
            "title": "S&P 500 Recovers After Tariff Shock as Investors Eye Fed Policy",
            "description": "Markets stabilise as traders assess the impact of new trade measures on corporate earnings.",
            "url": "#", "image": None,
        },
        {
            "source": "FT", "publishedAt": "2026-04-06T13:00:00Z",
            "title": "Apple Shares Rise on Strong iPhone Demand Data From Asia",
            "description": "Supply chain data suggests AAPL demand remains resilient despite macro headwinds.",
            "url": "#", "image": None,
        },
    ]
