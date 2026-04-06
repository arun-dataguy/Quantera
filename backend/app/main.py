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
        print("✅ Database connected")
    except Exception as e:
        print(f"⚠️ Database warning: {e}")
    yield
    # Shutdown
    try:
        from app.database import engine
        await engine.dispose()
    except:
        pass

app = FastAPI(title="Quantera API", lifespan=lifespan)

# CORS — Bearer token auth doesn't need allow_credentials; use allow_origins=["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check — must be first route
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "quantera-api"}

# Routers
from app.routers import auth, stripe_router, signals, news, wallet, market

app.include_router(auth.router,          prefix="/api/auth",    tags=["auth"])
app.include_router(stripe_router.router, prefix="/api/stripe",  tags=["stripe"])
app.include_router(signals.router,       prefix="/api/signals", tags=["signals"])
app.include_router(news.router,          prefix="/api/news",    tags=["news"])
app.include_router(wallet.router,        prefix="/api/wallet",  tags=["wallet"])
app.include_router(market.router,        prefix="/api/market",  tags=["market"])

@app.get("/")
async def root():
    return {"message": "Quantera API", "docs": "/docs"}
