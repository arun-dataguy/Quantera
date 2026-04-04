from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import AuthProvider, EmailVerification, PasswordReset, User
from app.services.auth import (
    create_access_token, create_password_reset_token,
    create_refresh_token, create_user, create_email_verification_token,
    decode_access_token, get_user_by_email, get_user_by_id,
    hash_password, revoke_refresh_token, store_refresh_token,
    update_last_login, validate_refresh_token, verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str

    @field_validator("password")
    @classmethod
    def strong_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def valid_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Full name is required")
        return v.strip()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def strong(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


# ── Helpers ───────────────────────────────────────────────────────────────────

def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "plan": user.plan.value if user.plan else "free",
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def auth_response(user: User, access_token: str, refresh_token: str) -> dict:
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_to_dict(user),
    }


# ── Database dependency ───────────────────────────────────────────────────────

async def get_db():
    from app.main import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        yield session


# ── Current user dependency ───────────────────────────────────────────────────

async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header[7:]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await get_user_by_id(int(payload["sub"]), db)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Register ──────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(body: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(body.email, db)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = await create_user(
        email=body.email,
        full_name=body.full_name,
        password=body.password,
        db=db,
    )

    access_token  = create_access_token(user.id, user.email, user.plan.value)
    refresh_token = create_refresh_token()
    await store_refresh_token(
        user.id, refresh_token, db,
        user_agent=request.headers.get("user-agent", ""),
        ip=request.client.host if request.client else "",
    )
    await update_last_login(user.id, db)
    return auth_response(user, access_token, refresh_token)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login")
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(body.email, db)
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token  = create_access_token(user.id, user.email, user.plan.value)
    refresh_token = create_refresh_token()
    await store_refresh_token(
        user.id, refresh_token, db,
        user_agent=request.headers.get("user-agent", ""),
        ip=request.client.host if request.client else "",
    )
    await update_last_login(user.id, db)
    return auth_response(user, access_token, refresh_token)


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/refresh")
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    rt = await validate_refresh_token(body.refresh_token, db)
    if not rt:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = await get_user_by_id(rt.user_id, db)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    await revoke_refresh_token(body.refresh_token, db)
    new_refresh = create_refresh_token()
    await store_refresh_token(user.id, new_refresh, db)

    access_token = create_access_token(user.id, user.email, user.plan.value)
    return {"access_token": access_token, "refresh_token": new_refresh, "token_type": "bearer"}


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    await revoke_refresh_token(body.refresh_token, db)
    return {"message": "Logged out successfully"}


# ── Me ────────────────────────────────────────────────────────────────────────

@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return user_to_dict(user)


# ── Google OAuth ──────────────────────────────────────────────────────────────

@router.get("/google")
async def google_login():
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")


@router.get("/google/callback")
async def google_callback(code: str, request: Request, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Google authentication failed")
        token_data = token_resp.json()

        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get Google user info")
        guser = userinfo_resp.json()

    email     = guser.get("email", "").lower()
    google_id = guser.get("sub")
    name      = guser.get("name", "")
    avatar    = guser.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = await get_user_by_email(email, db)
    if not user:
        user = await create_user(
            email=email,
            full_name=name,
            oauth_provider=AuthProvider.google,
            oauth_id=google_id,
            avatar_url=avatar,
            db=db,
        )
    else:
        await db.execute(
            update(User).where(User.id == user.id).values(
                oauth_id=google_id,
                avatar_url=avatar or user.avatar_url,
                is_verified=True,
            )
        )
        await db.commit()
        await db.refresh(user)

    access_token  = create_access_token(user.id, user.email, user.plan.value)
    refresh_token = create_refresh_token()
    await store_refresh_token(user.id, refresh_token, db)
    await update_last_login(user.id, db)

    frontend_url = f"{settings.frontend_url}/auth/callback"
    return RedirectResponse(
        f"{frontend_url}?access_token={access_token}&refresh_token={refresh_token}"
    )


# ── Email verification ────────────────────────────────────────────────────────

@router.post("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(EmailVerification).where(
            EmailVerification.token == token,
            EmailVerification.used == False,
            EmailVerification.expires_at > datetime.now(timezone.utc),
        )
    )
    ev = result.scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=400, detail="Invalid or expired verification link")

    await db.execute(update(User).where(User.id == ev.user_id).values(is_verified=True))
    await db.execute(update(EmailVerification).where(EmailVerification.id == ev.id).values(used=True))
    await db.commit()
    return {"message": "Email verified successfully"}


# ── Password reset ────────────────────────────────────────────────────────────

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(body.email, db)
    if user and user.hashed_password:
        token = await create_password_reset_token(user.id, db)
        print(f"[RESET] {settings.frontend_url}/reset-password?token={token}")
    return {"message": "If an account exists, a reset email has been sent"}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.token == body.token,
            PasswordReset.used == False,
            PasswordReset.expires_at > datetime.now(timezone.utc),
        )
    )
    pr = result.scalar_one_or_none()
    if not pr:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    await db.execute(
        update(User).where(User.id == pr.user_id).values(
            hashed_password=hash_password(body.new_password)
        )
    )
    await db.execute(update(PasswordReset).where(PasswordReset.id == pr.id).values(used=True))
    await db.commit()
    return {"message": "Password reset successfully"}
