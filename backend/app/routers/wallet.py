"""
routers/wallet.py — Paper trading wallet
Each user gets a $10,000 virtual portfolio. NOT real money.
"""
import asyncio
from datetime import datetime
from typing import Optional

import yfinance as yf
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, VirtualPortfolio, VirtualPosition, VirtualTrade
from app.routers.auth import get_current_user, get_db

router = APIRouter(tags=["Wallet"])

STARTING_BALANCE = 10_000.0
MAX_POSITION_PCT  = 0.20   # max 20% of portfolio in one ticker
MIN_CONFIDENCE    = 0.68   # minimum signal confidence to auto-trade


# ── Helpers ───────────────────────────────────────────────────────────────────

async def get_or_create_portfolio(user: User, db: AsyncSession) -> VirtualPortfolio:
    result = await db.execute(
        select(VirtualPortfolio).where(VirtualPortfolio.user_id == user.id)
    )
    portfolio = result.scalar_one_or_none()
    if portfolio is None:
        portfolio = VirtualPortfolio(user_id=user.id, cash_balance=STARTING_BALANCE)
        db.add(portfolio)
        await db.commit()
        await db.refresh(portfolio)
    return portfolio


def _get_price(ticker: str) -> float:
    """Fetch current price from yfinance synchronously."""
    try:
        info = yf.Ticker(ticker).fast_info
        price = getattr(info, "last_price", None) or getattr(info, "regularMarketPrice", None)
        if price and price > 0:
            return float(price)
    except Exception:
        pass
    return 0.0


async def fetch_price(ticker: str) -> float:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_price, ticker)


# ── Schemas ───────────────────────────────────────────────────────────────────

class TradeRequest(BaseModel):
    ticker: str
    action: str                          # "BUY" or "SELL"
    quantity: Optional[float] = None     # shares; None = auto-size
    signal_confidence: Optional[float] = None
    price: Optional[float] = None        # signal price passed from frontend as fallback


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/portfolio")
async def get_portfolio(
    user: User = Depends(get_current_user),
    db: AsyncSession  = Depends(get_db),
):
    """Return virtual portfolio summary with live P&L."""
    portfolio = await get_or_create_portfolio(user, db)

    # Load positions with live prices
    result = await db.execute(
        select(VirtualPosition).where(VirtualPosition.portfolio_id == portfolio.id)
    )
    positions_orm = result.scalars().all()

    total_market_value = 0.0
    positions_out = []
    for pos in positions_orm:
        live_price   = await fetch_price(pos.ticker)
        market_value = pos.quantity * (live_price or pos.avg_price)
        cost_basis   = pos.quantity * pos.avg_price
        unrealized   = market_value - cost_basis
        pct_change   = (unrealized / cost_basis * 100) if cost_basis else 0.0
        total_market_value += market_value
        positions_out.append({
            "ticker":        pos.ticker,
            "quantity":      round(pos.quantity, 4),
            "avg_price":     round(pos.avg_price, 4),
            "current_price": round(live_price, 4),
            "market_value":  round(market_value, 2),
            "unrealized_pnl": round(unrealized, 2),
            "pct_change":    round(pct_change, 2),
        })

    total_value   = portfolio.cash_balance + total_market_value
    total_pnl     = total_value - STARTING_BALANCE
    total_pnl_pct = (total_pnl / STARTING_BALANCE) * 100

    return {
        "cash_balance":      round(portfolio.cash_balance, 2),
        "invested_value":    round(total_market_value, 2),
        "total_value":       round(total_value, 2),
        "total_pnl":         round(total_pnl, 2),
        "total_pnl_pct":     round(total_pnl_pct, 2),
        "starting_balance":  STARTING_BALANCE,
        "positions":         positions_out,
    }


@router.get("/trades")
async def get_trades(
    user: User = Depends(get_current_user),
    db: AsyncSession  = Depends(get_db),
):
    """Return last 50 paper trades."""
    portfolio = await get_or_create_portfolio(user, db)

    result = await db.execute(
        select(VirtualTrade)
        .where(VirtualTrade.portfolio_id == portfolio.id)
        .order_by(VirtualTrade.executed_at.desc())
        .limit(50)
    )
    trades = result.scalars().all()
    return [
        {
            "id":                t.id,
            "ticker":            t.ticker,
            "action":            t.action,
            "quantity":          round(t.quantity, 4),
            "price":             round(t.price, 4),
            "total_value":       round(t.total_value, 2),
            "signal_confidence": round(t.signal_confidence * 100, 1) if t.signal_confidence else None,
            "executed_at":       t.executed_at.isoformat() if t.executed_at else None,
        }
        for t in trades
    ]


@router.post("/trade")
async def execute_trade(
    body: TradeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession  = Depends(get_db),
):
    """
    Execute a paper trade.
    BUY: deduct cash, create/update position.
    SELL: close position, add cash back.
    """
    ticker = body.ticker.upper().strip()
    action = body.action.upper()

    if action not in ("BUY", "SELL"):
        raise HTTPException(status_code=400, detail="action must be BUY or SELL")

    # Try live price first, fall back to price provided by frontend signal data
    price = await fetch_price(ticker)
    if price <= 0 and body.price and body.price > 0:
        price = body.price   # use the price from the signal (already shown to user)
    if price <= 0:
        raise HTTPException(status_code=400, detail=f"Could not fetch price for {ticker}")

    portfolio = await get_or_create_portfolio(user, db)

    # Load existing position (if any)
    pos_result = await db.execute(
        select(VirtualPosition).where(
            VirtualPosition.portfolio_id == portfolio.id,
            VirtualPosition.ticker == ticker,
        )
    )
    position = pos_result.scalar_one_or_none()

    if action == "BUY":
        # Auto-size: 10% of portfolio value, capped at MAX_POSITION_PCT
        total_value   = portfolio.cash_balance + sum(
            p.quantity * p.avg_price
            for p in (await db.execute(
                select(VirtualPosition).where(VirtualPosition.portfolio_id == portfolio.id)
            )).scalars().all()
        )
        alloc = min(total_value * 0.10, total_value * MAX_POSITION_PCT)
        quantity = body.quantity if body.quantity else round(alloc / price, 4)

        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")

        cost = quantity * price
        if cost > portfolio.cash_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient cash. Need ${cost:.2f}, have ${portfolio.cash_balance:.2f}"
            )

        # Update position (average down/up)
        if position:
            total_qty   = position.quantity + quantity
            position.avg_price = (position.quantity * position.avg_price + cost) / total_qty
            position.quantity  = total_qty
        else:
            position = VirtualPosition(
                portfolio_id=portfolio.id,
                ticker=ticker,
                quantity=quantity,
                avg_price=price,
            )
            db.add(position)

        portfolio.cash_balance -= cost

    else:  # SELL
        if not position or position.quantity <= 0:
            raise HTTPException(status_code=400, detail=f"No position in {ticker}")

        quantity = body.quantity if body.quantity else position.quantity  # default: sell all
        if quantity > position.quantity:
            quantity = position.quantity  # sell up to what we have

        proceeds = quantity * price
        position.quantity -= quantity
        portfolio.cash_balance += proceeds

        if position.quantity < 0.0001:
            await db.delete(position)

    # Record trade
    trade = VirtualTrade(
        portfolio_id=portfolio.id,
        ticker=ticker,
        action=action,
        quantity=quantity,
        price=price,
        total_value=quantity * price,
        signal_confidence=body.signal_confidence,
    )
    db.add(trade)
    await db.commit()

    return {
        "status":    "executed",
        "action":    action,
        "ticker":    ticker,
        "quantity":  round(quantity, 4),
        "price":     round(price, 4),
        "total":     round(quantity * price, 2),
        "cash_after": round(portfolio.cash_balance, 2),
    }


@router.post("/reset")
async def reset_portfolio(
    user: User = Depends(get_current_user),
    db: AsyncSession  = Depends(get_db),
):
    """Reset portfolio back to $10,000 (wipes all positions and trades)."""
    portfolio = await get_or_create_portfolio(user, db)

    # Delete positions
    pos_result = await db.execute(
        select(VirtualPosition).where(VirtualPosition.portfolio_id == portfolio.id)
    )
    for pos in pos_result.scalars().all():
        await db.delete(pos)

    # Delete trades
    trades_result = await db.execute(
        select(VirtualTrade).where(VirtualTrade.portfolio_id == portfolio.id)
    )
    for t in trades_result.scalars().all():
        await db.delete(t)

    portfolio.cash_balance = STARTING_BALANCE
    await db.commit()

    return {"status": "reset", "cash_balance": STARTING_BALANCE}
