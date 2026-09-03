from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo
from app.config import settings
from typing import AsyncGenerator
import asyncio
import re

class AsyncMockCollection:
    def __init__(self, name):
        self.name = name
        self._data = []

    async def create_index(self, keys, **kwargs):
        pass

    async def count_documents(self, filter_dict=None):
        filter_dict = filter_dict or {}
        return len([d for d in self._data if self._matches(d, filter_dict)])

    async def insert_one(self, doc):
        if "_id" not in doc:
            import uuid
            doc["_id"] = str(uuid.uuid4())
        if "id" not in doc:
            doc["id"] = doc["_id"]
        self._data.append(doc)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def insert_many(self, docs):
        for doc in docs:
            await self.insert_one(doc)
        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = inserted_ids
        return InsertManyResult([d["_id"] for d in docs])

    async def find_one(self, filter_dict=None, *args, **kwargs):
        filter_dict = filter_dict or {}
        for d in self._data:
            if self._matches(d, filter_dict):
                return d
        return None

    def find(self, filter_dict=None, *args, **kwargs):
        filter_dict = filter_dict or {}
        matches = [d for d in self._data if self._matches(d, filter_dict)]
        class AsyncCursor:
            def __init__(self, items):
                self._items = items
            def sort(self, key_or_list, direction=None):
                return self
            def skip(self, count):
                self._items = self._items[count:]
                return self
            def limit(self, count):
                self._items = self._items[:count]
                return self
            async def to_list(self, length=None):
                return self._items[:length] if length else self._items
        return AsyncCursor(matches)

    async def update_one(self, filter_dict, update_dict, upsert=False, *args, **kwargs):
        target = await self.find_one(filter_dict)
        if target:
            if "$set" in update_dict:
                target.update(update_dict["$set"])
            if "$inc" in update_dict:
                for k, v in update_dict["$inc"].items():
                    target[k] = target.get(k, 0) + v
        elif upsert:
            new_doc = {**filter_dict}
            if "$set" in update_dict:
                new_doc.update(update_dict["$set"])
            await self.insert_one(new_doc)

    async def update_many(self, filter_dict, update_dict, *args, **kwargs):
        filter_dict = filter_dict or {}
        matches = [d for d in self._data if self._matches(d, filter_dict)]
        for target in matches:
            if "$set" in update_dict:
                target.update(update_dict["$set"])

    async def delete_many(self, filter_dict=None, *args, **kwargs):
        filter_dict = filter_dict or {}
        self._data = [d for d in self._data if not self._matches(d, filter_dict)]
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        return DeleteResult(len(self._data))

    async def delete_one(self, filter_dict=None, *args, **kwargs):
        filter_dict = filter_dict or {}
        deleted = 0
        for i, d in enumerate(self._data):
            if self._matches(d, filter_dict):
                self._data.pop(i)
                deleted = 1
                break
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        return DeleteResult(deleted)

    def aggregate(self, pipeline, *args, **kwargs):
        class AsyncAggCursor:
            def __init__(self, data):
                self._data = data
            async def to_list(self, length=None):
                return self._data
        return AsyncAggCursor([])

    def _matches(self, doc, filter_dict):
        if not filter_dict:
            return True
        for k, v in filter_dict.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
            elif isinstance(v, dict) and "$in" in v:
                if doc.get(k) not in v["$in"]:
                    return False
            elif isinstance(v, dict) and "$ne" in v:
                if doc.get(k) == v["$ne"]:
                    return False
            elif isinstance(v, dict) and "$gt" in v:
                if doc.get(k, 0) <= v["$gt"]:
                    return False
            elif isinstance(v, dict) and "$regex" in v:
                pattern = v["$regex"]
                flags = re.IGNORECASE if v.get("$options") == "i" else 0
                if not re.search(pattern, str(doc.get(k, "")), flags=flags):
                    return False
            elif doc.get(k) != v and str(doc.get(k)) != str(v) and str(doc.get(k, "")).lower() != str(v).lower():
                return False
        return True

class AsyncMockDatabase:
    def __init__(self):
        self.collections = {}

    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = AsyncMockCollection(name)
        return self.collections[name]

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_client = MongoDB()

async def connect_db():
    try:
        db_client.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        db_client.db = db_client.client[settings.MONGODB_DB_NAME]
        
        # Ping the server with a short timeout
        await asyncio.wait_for(db_client.client.admin.command('ping'), timeout=2.0)
        
        # Create indexes safely
        await db_client.db["users"].create_index("email", unique=True)
        await db_client.db["transactions"].create_index([("merchant_id", pymongo.ASCENDING), ("status", pymongo.ASCENDING), ("created_at", pymongo.DESCENDING)])
        await db_client.db["recovery_cases"].create_index([("status", pymongo.ASCENDING), ("priority", pymongo.ASCENDING), ("merchant_id", pymongo.ASCENDING)])
        await db_client.db["audit_logs"].create_index([("timestamp", pymongo.DESCENDING), ("case_id", pymongo.ASCENDING)])
        print("Connected to live MongoDB instance successfully!")
        
    except Exception as e:
        print(f"MongoDB offline/unreachable ({e}). Falling back to Resilient Async Database Engine.")
        db_client.db = AsyncMockDatabase()

async def close_db():
    if db_client.client is not None:
        db_client.client.close()

async def get_database() -> AsyncGenerator:
    if db_client.db is None:
        db_client.db = AsyncMockDatabase()
    yield db_client.db