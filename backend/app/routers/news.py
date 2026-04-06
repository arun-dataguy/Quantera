from fastapi import APIRouter, Query
import requests
import os

router = APIRouter()
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "ac418135e878478494b847ea5e9bf2b5")

QUERIES = {
    "Global":  "stock market OR Federal Reserve OR trading OR Wall Street",
    "Crypto":  "Bitcoin OR Ethereum OR cryptocurrency OR crypto",
    "Stocks":  "AAPL OR NVDA OR Tesla OR earnings OR NYSE",
    "Forex":   "forex OR USD OR EUR OR interest rates OR currency",
}

@router.get("/feed")
async def get_news_feed(filter: str = Query("Global")):
    """Proxy NewsAPI — bypasses browser CORS restrictions."""
    try:
        query = QUERIES.get(filter, QUERIES["Global"])
        res = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": query,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 8,
                "apiKey": NEWS_API_KEY,
            },
            timeout=10,
        )
        data = res.json()
        articles = data.get("articles", [])

        # Clean and return
        return {
            "articles": [
                {
                    "source":      a.get("source", {}).get("name", "NEWS"),
                    "title":       a.get("title", ""),
                    "description": a.get("description", ""),
                    "url":         a.get("url", ""),
                    "image":       a.get("urlToImage"),
                    "publishedAt": a.get("publishedAt", ""),
                }
                for a in articles
                if a.get("title") and "[Removed]" not in a.get("title", "")
            ],
            "filter": filter,
            "total":  len(articles),
        }
    except Exception as e:
        return {"articles": [], "error": str(e)}
