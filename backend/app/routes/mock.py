from typing import Any
from fastapi import APIRouter, HTTPException
from ..mock_store import (
    append_to_nested_list,
    append_to_section,
    get_section,
    update_section,
)

router = APIRouter(prefix="/api", tags=["mock"])


@router.get("/dashboard")
def get_dashboard() -> Any:
    return get_section("dashboard")


@router.get("/clients")
def get_clients() -> Any:
    return get_section("clients")


@router.get("/staff")
def get_staff() -> Any:
    return get_section("staff")


@router.get("/therapists")
def get_therapists() -> Any:
    return get_section("therapists")


@router.get("/rooms")
def get_rooms() -> Any:
    return get_section("rooms")


@router.get("/appointments")
def get_appointments() -> Any:
    return get_section("appointments")


@router.post("/appointments")
def add_appointment(payload: dict[str, Any]) -> Any:
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Appointment payload must be an object.",
        )
    return append_to_nested_list("appointments", "upcoming_today", payload)


@router.get("/services")
def get_services() -> Any:
    return get_section("services")


@router.get("/offers")
def get_offers() -> Any:
    return get_section("offers")


@router.get("/analytics")
def get_analytics() -> Any:
    return get_section("analytics")


@router.get("/insights")
def get_insights() -> Any:
    return get_section("insights")


@router.get("/notifications")
def get_notifications() -> Any:
    return get_section("notifications")


@router.get("/history/{page_key}")
def get_history(page_key: str) -> Any:
    history = get_section("recent_activity") or {}
    if not isinstance(history, dict):
        return []
    return history.get(page_key, [])


@router.get("/settings")
def get_settings() -> Any:
    return get_section("settings")


@router.put("/settings")
def put_settings(payload: dict[str, Any]) -> Any:
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Settings payload must be an object.",
        )
    return update_section("settings", payload)


@router.post("/clients")
def add_client(payload: dict[str, Any]) -> Any:
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Client payload must be an object.",
        )
    return append_to_section("clients", payload)


@router.post("/staff")
def add_staff(payload: dict[str, Any]) -> Any:
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Staff payload must be an object.",
        )
    return append_to_section("staff", payload)


@router.post("/therapists")
def add_therapist(payload: dict[str, Any]) -> Any:
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Therapist payload must be an object.",
        )
    return append_to_section("therapists", payload)


@router.post("/rooms")
def add_room(payload: dict[str, Any]) -> Any:
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Room payload must be an object.",
        )
    return append_to_section("rooms", payload)
