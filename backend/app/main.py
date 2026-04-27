from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .db import get_db, is_db_connected
from .routes.auth import router as auth_router
from .routes.mock import router as mock_router
from .security import hash_secret


app = FastAPI(title="MoviCloud SPA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(mock_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "db_connected": is_db_connected()}


@app.on_event("startup")
def startup():
    if is_db_connected():
        try:
            db = get_db()
            db.captchas.create_index(
                "created_at",
                expireAfterSeconds=settings.captcha_ttl_seconds,
            )
            db.users.create_index("email", unique=True)

            admin_email = settings.admin_email.strip().lower()
            if not db.users.find_one({"email": admin_email}):
                db.users.insert_one(
                    {
                        "email": admin_email,
                        "password_hash": hash_secret(settings.admin_password),
                        "role": "admin",
                        "created_at": datetime.utcnow(),
                    }
                )
            print("Connected to MongoDB successfully.")
        except Exception as e:
            print(f"Warning: Could not initialize MongoDB collections. Error: {e}")
    else:
        print("Warning: Could not connect to MongoDB. Using in-memory fallbacks for Auth.")
