from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup — don't crash if DB fails
    try:
        from app.database import engine, Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database connected")
    except Exception as e:
        print(f"Database warning (no local DB): {type(e).__name__}")
    yield
    # Shutdown
    try:
        from app.database import engine
        await engine.dispose()
    except:
        pass

app = FastAPI(title="Quantera API", lifespan=lifespan)

# CORS
_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://quantera.markets",
    "https://www.quantera.markets",
] + [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(_origins)),
    allow_origin_regex=r"https://quantera.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Health check — must be first route
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "quantera-api"}

# Routers
from app.routers import auth, stripe_router, signals, news, wallet, market, backtest

app.include_router(auth.router,          prefix="/api/auth",      tags=["auth"])
app.include_router(stripe_router.router, prefix="/api/stripe",    tags=["stripe"])
app.include_router(signals.router,       prefix="/api/signals",   tags=["signals"])
app.include_router(news.router,          prefix="/api/news",      tags=["news"])
app.include_router(wallet.router,        prefix="/api/wallet",    tags=["wallet"])
app.include_router(market.router,        prefix="/api/market",    tags=["market"])
app.include_router(backtest.router,      prefix="/api/backtest",  tags=["backtest"])

@app.get("/")
async def root():
    return {"message": "Quantera API", "docs": "/docs"}
