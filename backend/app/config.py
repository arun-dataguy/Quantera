from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    app_env: str = "development"
    secret_key: str = "quantera_dev_secret"
    api_port: int = 8003
    frontend_url: str = "http://localhost:3000"

    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    database_url: str = "postgresql+asyncpg://quantera:password@localhost:5433/quantera"
    redis_url: str = "redis://localhost:6380/0"

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8003/api/auth/google/callback"

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_premium_price_id: str = ""

    email_api_key: str = ""
    email_from: str = "noreply@quantera.io"

    allowed_origins: list = []

    @model_validator(mode="after")
    def build_allowed_origins(self):
        base = ["http://localhost:3000", "http://localhost:5173"]
        if self.frontend_url not in base:
            base.append(self.frontend_url)
        self.allowed_origins = base
        return self

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()