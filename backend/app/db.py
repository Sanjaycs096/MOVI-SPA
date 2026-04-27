from pymongo import MongoClient
from .config import settings

try:
    _client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=2000)
    _db = _client[settings.mongo_db]
    # We don't ping here because we want it to be lazy, but we'll provide a check
except Exception:
    _client = None
    _db = None


def get_db():
    return _db


def is_db_connected():
    if _db is None:
        return False
    try:
        _db.command("ping")
        return True
    except Exception:
        return False
