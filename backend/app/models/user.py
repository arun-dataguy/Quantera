from datetime import datetime
from sqlalchemy import (
    BigInteger, Boolean, Column, DateTime, Float, Integer,
    String, Text, func, Enum as SAEnum, ForeignKey
)
from sqlalchemy.orm import DeclarativeBase, relationship
import enum


class Base(DeclarativeBase):
    pass


class PlanTier(str, enum.Enum):
    free    = "free"
    pro     = "pro"
    premium = "premium"


class AuthProvider(str, enum.Enum):
    email  = "email"
    google = "google"


class User(Base):
    __tablename__ = "users"

    id              = Column(BigInteger, primary_key=True, autoincrement=True)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    full_name       = Column(String(255))
    avatar_url      = Column(Text)
    hashed_password = Column(String(255))
    auth_provider   = Column(SAEnum(AuthProvider), default=AuthProvider.email)
    oauth_id        = Column(String(255))
    is_verified     = Column(Boolean, default=False)
    is_active       = Column(Boolean, default=True)
    plan            = Column(SAEnum(PlanTier), default=PlanTier.free)
    stripe_customer_id     = Column(String(255))
    stripe_subscription_id = Column(String(255))
    subscription_status    = Column(String(50), default="inactive")
    plan_expires_at        = Column(DateTime)
    trial_ends_at          = Column(DateTime)
    created_at      = Column(DateTime, server_default=func.now())
    updated_at      = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login_at   = Column(DateTime)


class VirtualPortfolio(Base):
    __tablename__ = "virtual_portfolios"

    id            = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id       = Column(BigInteger, ForeignKey("users.id"), unique=True, nullable=False)
    cash_balance  = Column(Float, default=10000.0, nullable=False)  # starts at $10,000
    created_at    = Column(DateTime, server_default=func.now())
    updated_at    = Column(DateTime, server_default=func.now(), onupdate=func.now())

    positions = relationship("VirtualPosition", back_populates="portfolio", cascade="all, delete-orphan")
    trades    = relationship("VirtualTrade",    back_populates="portfolio", cascade="all, delete-orphan", order_by="VirtualTrade.executed_at.desc()")


class VirtualPosition(Base):
    __tablename__ = "virtual_positions"

    id            = Column(BigInteger, primary_key=True, autoincrement=True)
    portfolio_id  = Column(BigInteger, ForeignKey("virtual_portfolios.id"), nullable=False)
    ticker        = Column(String(20), nullable=False)
    quantity      = Column(Float, nullable=False)
    avg_price     = Column(Float, nullable=False)
    created_at    = Column(DateTime, server_default=func.now())
    updated_at    = Column(DateTime, server_default=func.now(), onupdate=func.now())

    portfolio = relationship("VirtualPortfolio", back_populates="positions")


class VirtualTrade(Base):
    __tablename__ = "virtual_trades"

    id                = Column(BigInteger, primary_key=True, autoincrement=True)
    portfolio_id      = Column(BigInteger, ForeignKey("virtual_portfolios.id"), nullable=False)
    ticker            = Column(String(20), nullable=False)
    action            = Column(String(10), nullable=False)   # BUY / SELL
    quantity          = Column(Float, nullable=False)
    price             = Column(Float, nullable=False)
    total_value       = Column(Float, nullable=False)
    signal_confidence = Column(Float)
    executed_at       = Column(DateTime, server_default=func.now())

    portfolio = relationship("VirtualPortfolio", back_populates="trades")


class EmailVerification(Base):
    __tablename__ = "email_verifications"
    id         = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id    = Column(BigInteger, nullable=False, index=True)
    token      = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class PasswordReset(Base):
    __tablename__ = "password_resets"
    id         = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id    = Column(BigInteger, nullable=False, index=True)
    token      = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id         = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id    = Column(BigInteger, nullable=False, index=True)
    token      = Column(String(512), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    revoked    = Column(Boolean, default=False)
    user_agent = Column(Text)
    ip_address = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())