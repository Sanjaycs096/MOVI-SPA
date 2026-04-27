import base64
import random
from typing import cast
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pymongo.database import Database
from ..config import settings
from ..db import get_db, is_db_connected
from ..security import create_access_token, hash_secret, verify_secret


router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory store for captchas when DB is unavailable
_memory_captchas = {}


class CaptchaResponse(BaseModel):
    captcha_id: str
    image_data: str
    expires_in: int


class LoginRequest(BaseModel):
    email: str
    password: str
    captcha_id: str
    captcha_answer: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _build_captcha_text(length: int = 5) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(random.choice(alphabet) for _ in range(length))


def _build_captcha_svg(text: str) -> str:
    width = 140
    height = 40
    noise_lines = "".join(
        (
            f"<line x1='{random.randint(0, width)}' "
            f"y1='{random.randint(0, height)}' "
            f"x2='{random.randint(0, width)}' "
            f"y2='{random.randint(0, height)}' "
            "stroke='#d9d2c7' stroke-width='1' opacity='0.6' />"
        )
        for _ in range(6)
    )
    noise_dots = "".join(
        (
            f"<circle cx='{random.randint(4, width - 4)}' "
            f"cy='{random.randint(4, height - 4)}' "
            "r='1' fill='#e5ded3' opacity='0.8' />"
        )
        for _ in range(18)
    )
    svg = (
        "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='40' "
        "viewBox='0 0 140 40'>"
        "<rect x='0.5' y='0.5' width='139' height='39' rx='10' "
        "fill='#f7f4ee' stroke='#e4ded6' />"
        f"{noise_lines}"
        f"{noise_dots}"
        "<text x='70' y='26' text-anchor='middle' "
        "font-family='Verdana, Arial, sans-serif' font-size='18' "
        "font-weight='700' letter-spacing='6' fill='#3a3a3a'>"
        f"{text}"
        "</text>"
        "</svg>"
    )
    encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded}"


@router.post("/captcha", response_model=CaptchaResponse)
def create_captcha():
    answer = _build_captcha_text()
    image_data = _build_captcha_svg(answer)
    captcha_id = str(uuid4())

    captcha_doc = {
        "_id": captcha_id,
        "answer_hash": hash_secret(answer),
        "created_at": datetime.utcnow(),
    }

    if is_db_connected():
        db = cast(Database, get_db())
        db.captchas.insert_one(captcha_doc)
    else:
        _memory_captchas[captcha_id] = captcha_doc

    return CaptchaResponse(
        captcha_id=captcha_id,
        image_data=image_data,
        expires_in=settings.captcha_ttl_seconds,
    )


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    captcha = None
    if is_db_connected():
        db = cast(Database, get_db())
        captcha = db.captchas.find_one({"_id": payload.captcha_id})
        if captcha:
            db.captchas.delete_one({"_id": payload.captcha_id})
    else:
        captcha = _memory_captchas.pop(payload.captcha_id, None)

    if not captcha:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired captcha.",
        )

    captcha_valid = verify_secret(
        payload.captcha_answer.strip(),
        captcha.get("answer_hash", ""),
    )

    if not captcha_valid:
        raise HTTPException(status_code=400, detail="Invalid captcha answer.")

    email = _normalize_email(payload.email)
    user = None

    if is_db_connected():
        db = cast(Database, get_db())
        user = db.users.find_one({"email": email})
        admin_email = settings.admin_email.strip().lower()
        admin_password = settings.admin_password
        is_email_admin = email == admin_email
        is_password_admin = payload.password == admin_password
        is_admin_login = is_email_admin and is_password_admin
        if is_admin_login:
            password_hash = hash_secret(admin_password)
            db.users.update_one(
                {"email": admin_email},
                {
                    "$set": {
                        "password_hash": password_hash,
                        "role": "admin",
                    },
                    "$setOnInsert": {
                        "email": admin_email,
                        "created_at": datetime.utcnow(),
                    },
                },
                upsert=True,
            )
            user = {
                "email": admin_email,
                "password_hash": password_hash,
            }
    else:
        # Mock admin login if DB is down
        admin_email = settings.admin_email.strip().lower()
        if email == admin_email:
            user = {
                "email": admin_email,
                "password_hash": hash_secret(settings.admin_password),
            }

    password_hash = user.get("password_hash", "") if user else ""
    if not user or not verify_secret(payload.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    token = create_access_token(user["email"])
    return LoginResponse(access_token=token)
