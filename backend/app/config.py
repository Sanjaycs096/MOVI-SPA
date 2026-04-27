import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()

@dataclass(frozen=True)
class Settings:
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    mongo_db: str = os.getenv("MONGO_DB", "movicloud")
    jwt_secret: str = os.getenv("JWT_SECRET", "change-me")
    jwt_algorithm: str = "HS256"
    jwt_exp_minutes: int = int(os.getenv("JWT_EXP_MINUTES", "30"))
    cors_origins: list[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:5173",
            ).split(",")
            if origin.strip()
        ]
    )
    admin_email: str = os.getenv("ADMIN_EMAIL", "admin@spa.com")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "Admin123")
    captcha_ttl_seconds: int = int(os.getenv("CAPTCHA_TTL_SECONDS", "300"))


settings = Settings()
