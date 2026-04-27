from datetime import datetime
from typing import cast
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo.database import Database
from pymongo.errors import OperationFailure
from .config import settings
from .db import get_db, is_db_connected
from .routes.auth import router as auth_router
from .routes.mock import router as mock_router
from .security import hash_secret


app = FastAPI(title="MoviCloud SPA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https?://.*\.onrender\.com",
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
            db = cast(Database, db)
            index_name = "created_at_1"
            desired_ttl = settings.captcha_ttl_seconds
            index_info = db.captchas.index_information().get(index_name)
            existing_ttl = None
            if index_info:
                existing_ttl = index_info.get("expireAfterSeconds")
            try:
                if existing_ttl is not None and existing_ttl != desired_ttl:
                    db.captchas.drop_index(index_name)
                db.captchas.create_index(
                    "created_at",
                    expireAfterSeconds=desired_ttl,
                )
            except OperationFailure as e:
                print(
                    "Warning: Could not update captcha TTL index. "
                    f"Error: {e}"
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
        except OperationFailure as e:
            print(
                "Warning: Could not initialize MongoDB collections. "
                f"Error: {e}"
            )
        except Exception as e:
            print(
                "Warning: Could not initialize MongoDB collections. "
                f"Error: {e}"
            )
    else:
        print(
            "Warning: Could not connect to MongoDB. "
            "Using in-memory fallbacks for Auth."
        )
