"""
routers/market.py — Market Movers, Top Gainers/Losers, Stock Search
Uses Yahoo Finance screener (no API key required).
"""
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

router = APIRouter(tags=["Market"])

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}

# 30-minute cache
_cache: dict = {}
_cache_time: dict = {}
CACHE_TTL = 1800

# ── Known AI signals from our signal engine (for badge overlay) ───────────────
KNOWN_SIGNALS = {
    "AAPL": "BUY",  "NVDA": "HOLD", "META": "BUY",  "MSFT": "HOLD",
    "AMZN": "BUY",  "GOOGL": "HOLD","TSLA": "HOLD", "JPM": "BUY",
}

INDICES = [
    {"symbol": "^GSPC",  "name": "S&P 500",    "tv": "SP:SPX"},
    {"symbol": "^IXIC",  "name": "NASDAQ",      "tv": "NASDAQ:COMP"},
    {"symbol": "^DJI",   "name": "Dow Jones",   "tv": "DJ:DJI"},
    {"symbol": "^RUT",   "name": "Russell 2000","tv": "TVC:RUT"},
]

MOCK_GAINERS = [
    {"symbol":"NVDL","name":"GraniteShares 2x Long NVDA","price":24.51,"change":15.32,"change_pct":8.48,"volume":"12.4M"},
    {"symbol":"SMCI","name":"Super Micro Computer","price":34.80,"change":3.21,"change_pct":7.34,"volume":"8.1M"},
    {"symbol":"TSLA","name":"Tesla Inc","price":283.84,"change":18.72,"change_pct":7.06,"volume":"41.2M"},
    {"symbol":"PLTR","name":"Palantir Technologies","price":90.10,"change":5.41,"change_pct":6.38,"volume":"66.9M"},
    {"symbol":"MSTR","name":"Strategy Inc","price":316.19,"change":17.43,"change_pct":5.83,"volume":"9.3M"},
    {"symbol":"AMD","name":"Advanced Micro Devices","price":94.62,"change":4.91,"change_pct":5.47,"volume":"22.7M"},
    {"symbol":"IONQ","name":"IonQ Inc","price":29.14,"change":1.49,"change_pct":5.39,"volume":"7.8M"},
    {"symbol":"COIN","name":"Coinbase Global","price":172.73,"change":8.21,"change_pct":4.99,"volume":"9.1M"},
]

MOCK_LOSERS = [
    {"symbol":"AAPL","name":"Apple Inc","price":188.38,"change":-14.84,"change_pct":-7.29,"volume":"52.4M"},
    {"symbol":"AMZN","name":"Amazon.com","price":175.35,"change":-13.11,"change_pct":-6.96,"volume":"38.2M"},
    {"symbol":"MSFT","name":"Microsoft Corp","price":378.80,"change":-24.72,"change_pct":-6.13,"volume":"24.1M"},
    {"symbol":"GOOGL","name":"Alphabet Inc","price":155.66,"change":-9.63,"change_pct":-5.83,"volume":"29.8M"},
    {"symbol":"META","name":"Meta Platforms","price":537.08,"change":-32.11,"change_pct":-5.64,"volume":"19.7M"},
    {"symbol":"NFLX","name":"Netflix Inc","price":868.10,"change":-51.34,"change_pct":-5.58,"volume":"6.4M"},
    {"symbol":"AVGO","name":"Broadcom Inc","price":156.24,"change":-8.92,"change_pct":-5.40,"volume":"14.2M"},
    {"symbol":"ORCL","name":"Oracle Corp","price":141.78,"change":-7.83,"change_pct":-5.24,"volume":"10.6M"},
]

MOCK_ACTIVES = [
    {"symbol":"TSLA","name":"Tesla Inc","price":283.84,"change":18.72,"change_pct":7.06,"volume":"41.2M"},
    {"symbol":"AAPL","name":"Apple Inc","price":188.38,"change":-14.84,"change_pct":-7.29,"volume":"52.4M"},
    {"symbol":"NVDA","name":"NVIDIA Corp","price":102.83,"change":4.21,"change_pct":4.27,"volume":"38.8M"},
    {"symbol":"AMZN","name":"Amazon.com","price":175.35,"change":-13.11,"change_pct":-6.96,"volume":"38.2M"},
    {"symbol":"SPY","name":"SPDR S&P 500 ETF","price":502.11,"change":-12.34,"change_pct":-2.40,"volume":"97.3M"},
    {"symbol":"AMD","name":"Advanced Micro Devices","price":94.62,"change":4.91,"change_pct":5.47,"volume":"22.7M"},
]


def _parse_quotes(data: dict) -> list:
    try:
        quotes = data["finance"]["result"][0]["quotes"]
        out = []
        for q in quotes:
            price      = q.get("regularMarketPrice", 0)
            change     = q.get("regularMarketChange", 0)
            change_pct = q.get("regularMarketChangePercent", 0)
            volume     = q.get("regularMarketVolume", 0)
            # Format volume
            if volume >= 1_000_000:
                vol_str = f"{volume/1_000_000:.1f}M"
            elif volume >= 1_000:
                vol_str = f"{volume/1_000:.0f}K"
            else:
                vol_str = str(volume)

            out.append({
                "symbol":     q.get("symbol", ""),
                "name":       q.get("shortName", q.get("longName", "")),
                "price":      round(price, 2),
                "change":     round(change, 2),
                "change_pct": round(change_pct, 2),
                "volume":     vol_str,
                "signal":     KNOWN_SIGNALS.get(q.get("symbol", ""), None),
            })
        return out
    except Exception:
        return []


async def _fetch_screener(scr_id: str) -> list:
    now = datetime.now(timezone.utc).timestamp()
    if _cache.get(scr_id) and (now - _cache_time.get(scr_id, 0)) < CACHE_TTL:
        return _cache[scr_id]

    url = (
        f"https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved"
        f"?scrIds={scr_id}&count=10&formatted=false&lang=en-US&region=US"
    )
    try:
        async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
            r = await client.get(url)
            r.raise_for_status()
            quotes = _parse_quotes(r.json())
            if quotes:
                # Add signal badges for known tickers
                for q in quotes:
                    q["signal"] = KNOWN_SIGNALS.get(q["symbol"])
                _cache[scr_id] = quotes
                _cache_time[scr_id] = now
                return quotes
    except Exception as e:
        print(f"⚠️ Yahoo screener failed ({scr_id}): {e}")

    # Fallback to mock
    mock = MOCK_GAINERS if scr_id == "day_gainers" else \
           MOCK_LOSERS  if scr_id == "day_losers"  else MOCK_ACTIVES
    for q in mock:
        q["signal"] = KNOWN_SIGNALS.get(q["symbol"])
    return mock


async def _fetch_indices() -> list:
    now = datetime.now(timezone.utc).timestamp()
    cache_key = "indices"
    if _cache.get(cache_key) and (now - _cache_time.get(cache_key, 0)) < CACHE_TTL:
        return _cache[cache_key]

    symbols = ",".join(i["symbol"] for i in INDICES)
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/spark"
        f"?symbols={symbols}&range=1d&interval=5m"
    )
    # Simpler: use the quote endpoint
    quote_url = (
        f"https://query1.finance.yahoo.com/v7/finance/quote"
        f"?symbols={symbols}&fields=regularMarketPrice,regularMarketChangePercent,regularMarketChange"
    )
    try:
        async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
            r = await client.get(quote_url)
            r.raise_for_status()
            data  = r.json()
            quotes = data.get("quoteResponse", {}).get("result", [])
            out = []
            for idx, q in zip(INDICES, quotes):
                out.append({
                    "symbol":     idx["symbol"],
                    "name":       idx["name"],
                    "tv":         idx["tv"],
                    "price":      round(q.get("regularMarketPrice", 0), 2),
                    "change":     round(q.get("regularMarketChange", 0), 2),
                    "change_pct": round(q.get("regularMarketChangePercent", 0), 2),
                })
            if out:
                _cache[cache_key] = out
                _cache_time[cache_key] = now
                return out
    except Exception as e:
        print(f"⚠️ Indices fetch failed: {e}")

    # Fallback mock indices
    return [
        {"symbol":"^GSPC","name":"S&P 500","tv":"SP:SPX","price":5074.08,"change":-322.44,"change_pct":-5.97},
        {"symbol":"^IXIC","name":"NASDAQ","tv":"NASDAQ:COMP","price":15587.79,"change":-1050.44,"change_pct":-6.30},
        {"symbol":"^DJI","name":"Dow Jones","tv":"DJ:DJI","price":38314.86,"change":-2231.07,"change_pct":-5.50},
        {"symbol":"^RUT","name":"Russell 2000","tv":"TVC:RUT","price":1827.04,"change":-137.22,"change_pct":-6.99},
    ]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/movers")
async def get_movers():
    """Top gainers, losers, most active, and market indices."""
    gainers, losers, actives, indices = await _fetch_screener("day_gainers"), \
        await _fetch_screener("day_losers"), \
        await _fetch_screener("most_actives"), \
        await _fetch_indices()

    return {
        "gainers":  gainers,
        "losers":   losers,
        "actives":  actives,
        "indices":  indices,
        "updated":  datetime.now(timezone.utc).isoformat(),
    }


STOCK_FALLBACK = [
    {"symbol":"AAPL","name":"Apple Inc.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"NVDA","name":"NVIDIA Corporation","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"MSFT","name":"Microsoft Corporation","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"GOOGL","name":"Alphabet Inc.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"AMZN","name":"Amazon.com Inc.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"META","name":"Meta Platforms Inc.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"TSLA","name":"Tesla Inc.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"JPM","name":"JPMorgan Chase & Co.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"BRK-B","name":"Berkshire Hathaway Inc.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"V","name":"Visa Inc.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"JNJ","name":"Johnson & Johnson","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"WMT","name":"Walmart Inc.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"XOM","name":"Exxon Mobil Corporation","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"MA","name":"Mastercard Incorporated","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"UNH","name":"UnitedHealth Group Inc.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"HD","name":"The Home Depot Inc.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"PG","name":"Procter & Gamble Co.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"BAC","name":"Bank of America Corp.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"AVGO","name":"Broadcom Inc.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"COST","name":"Costco Wholesale Corp.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"AMD","name":"Advanced Micro Devices","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"NFLX","name":"Netflix Inc.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"CRM","name":"Salesforce Inc.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"ORCL","name":"Oracle Corporation","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"INTC","name":"Intel Corporation","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"DIS","name":"The Walt Disney Company","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"PYPL","name":"PayPal Holdings Inc.","exchange":"NASDAQ","type":"EQUITY"},
    {"symbol":"UBER","name":"Uber Technologies Inc.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"SHOP","name":"Shopify Inc.","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"PLTR","name":"Palantir Technologies","exchange":"NYSE","type":"EQUITY"},
    {"symbol":"BTC-USD","name":"Bitcoin USD","exchange":"CCC","type":"CRYPTOCURRENCY"},
    {"symbol":"ETH-USD","name":"Ethereum USD","exchange":"CCC","type":"CRYPTOCURRENCY"},
    {"symbol":"SOL-USD","name":"Solana USD","exchange":"CCC","type":"CRYPTOCURRENCY"},
    {"symbol":"BNB-USD","name":"BNB USD","exchange":"CCC","type":"CRYPTOCURRENCY"},
]

def _fallback_search(q: str):
    q = q.lower()
    return [
        {**s, "signal": KNOWN_SIGNALS.get(s["symbol"])}
        for s in STOCK_FALLBACK
        if q in s["symbol"].lower() or q in s["name"].lower()
    ][:8]

@router.get("/search")
async def search_stocks(q: str = Query(..., min_length=1)):
    """Search stocks by symbol or company name — Yahoo Finance with static fallback."""
    try:
        url = (
            f"https://query1.finance.yahoo.com/v1/finance/search"
            f"?q={q}&quotesCount=8&newsCount=0&enableFuzzyQuery=true&lang=en-US"
        )
        async with httpx.AsyncClient(timeout=6, headers=HEADERS) as client:
            r = await client.get(url)
            r.raise_for_status()
            quotes = r.json().get("quotes", [])
            results = [
                {
                    "symbol":   item.get("symbol", ""),
                    "name":     item.get("shortname", item.get("longname", "")),
                    "exchange": item.get("exchange", ""),
                    "type":     item.get("quoteType", ""),
                    "signal":   KNOWN_SIGNALS.get(item.get("symbol", "")),
                }
                for item in quotes
                if item.get("quoteType") in ("EQUITY", "ETF", "CRYPTOCURRENCY")
            ]
            if results:
                return results
    except Exception:
        pass
    # Fallback: filter static list
    return _fallback_search(q)
