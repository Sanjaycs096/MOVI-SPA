import json
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).with_name("mock_data.json")


def load_data() -> dict[str, Any]:
    with DATA_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_data(data: dict[str, Any]) -> None:
    with DATA_PATH.open("w", encoding="utf-8") as file:
        json.dump(data, file, indent=2)


def get_section(section: str) -> Any:
    data = load_data()
    return data.get(section)


def update_section(section: str, payload: Any) -> Any:
    data = load_data()
    data[section] = payload
    save_data(data)
    return data[section]


def append_to_section(section: str, payload: dict[str, Any]) -> dict[str, Any]:
    data = load_data()
    items = data.get(section, [])
    if not isinstance(items, list):
        raise ValueError("Target section is not a list.")

    new_item = dict(payload)
    if "id" not in new_item:
        existing_ids = [item.get("id", 0) for item in items]
        new_item["id"] = max(existing_ids or [0]) + 1
    items.append(new_item)
    data[section] = items
    save_data(data)
    return new_item


def append_to_nested_list(
    section: str,
    key: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    data = load_data()
    container = data.get(section, {})
    if not isinstance(container, dict):
        raise ValueError("Target section is not an object.")

    items = container.get(key, [])
    if not isinstance(items, list):
        raise ValueError("Target key is not a list.")

    new_item = dict(payload)
    if "id" not in new_item:
        existing_ids = [item.get("id", 0) for item in items]
        new_item["id"] = max(existing_ids or [0]) + 1
    items.append(new_item)
    container[key] = items
    data[section] = container
    save_data(data)
    return new_item
