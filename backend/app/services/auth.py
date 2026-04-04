import bcrypt as _bcrypt
import secrets
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User, RefreshToken, EmailVerification, PasswordReset


def _to_bytes(s):
    return s.encode("utf-8") if isinstance(s, str) else s


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(_to_bytes(password), _bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(_to_bytes(plain), _to_bytes(hashed))


def create_access_token(user_id: int, email: str, plan: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "plan": plan,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


async def get_user_by_email(email: str, db: AsyncSession) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_id(user_id: int, db: AsyncSession) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(
    email: str,
    full_name: str,
    password: Optional[str] = None,
    oauth_provider: Optional[str] = None,
    oauth_id: Optional[str] = None,
    avatar_url: Optional[str] = None,
    db: AsyncSession = None,
) -> User:
    from app.models.user import AuthProvider
    user = User(
        email=email.lower(),
        full_name=full_name,
        hashed_password=hash_password(password) if password else None,
        auth_provider=oauth_provider or AuthProvider.email,
        oauth_id=oauth_id,
        avatar_url=avatar_url,
        is_verified=bool(oauth_provider),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def store_refresh_token(
    user_id: int, token: str, db: AsyncSession,
    user_agent: str = "", ip: str = ""
) -> RefreshToken:
    rt = RefreshToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days),
        user_agent=user_agent,
        ip_address=ip,
    )
    db.add(rt)
    await db.commit()
    return rt


async def validate_refresh_token(token: str, db: AsyncSession) -> Optional[RefreshToken]:
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == token,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.utcnow(),
        )
    )
    return result.scalar_one_or_none()


async def revoke_refresh_token(token: str, db: AsyncSession):
    await db.execute(
        update(RefreshToken).where(RefreshToken.token == token).values(revoked=True)
    )
    await db.commit()


async def create_email_verification_token(user_id: int, db: AsyncSession) -> str:
    token = secrets.token_urlsafe(32)
    ev = EmailVerification(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(ev)
    await db.commit()
    return token


async def create_password_reset_token(user_id: int, db: AsyncSession) -> str:
    token = secrets.token_urlsafe(32)
    pr = PasswordReset(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=2),
    )
    db.add(pr)
    await db.commit()
    return token


async def update_last_login(user_id: int, db: AsyncSession):
    await db.execute(
        update(User).where(User.id == user_id).values(
            last_login_at=datetime.utcnow()
        )
    )
    await db.commit()