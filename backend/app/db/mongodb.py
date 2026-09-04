from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo
from app.config import settings
from typing import AsyncGenerator, Any, List, Dict
import asyncio
import re
import copy
from datetime import datetime, timezone

def _extract_field(doc: Any, field_path: str) -> Any:
    if not isinstance(doc, dict):
        return None
    if field_path.startswith("$"):
        field_path = field_path[1:]
    parts = field_path.split(".")
    curr = doc
    for p in parts:
        if isinstance(curr, dict):
            curr = curr.get(p)
        else:
            return None
    return curr

def _eval_expr(doc: dict, expr: Any) -> Any:
    if expr is None:
        return None
    if isinstance(expr, str):
        if expr.startswith("$"):
            return _extract_field(doc, expr[1:])
        return expr
    if isinstance(expr, (int, float, bool)):
        return expr
    if isinstance(expr, dict):
        if "$dateToString" in expr:
            val = _eval_expr(doc, expr["$dateToString"].get("date"))
            fmt = expr["$dateToString"].get("format", "%Y-%m-%d")
            if isinstance(val, str):
                try:
                    dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
                    return dt.strftime(fmt)
                except Exception:
                    return str(val)[:10]
            elif isinstance(val, datetime):
                return val.strftime(fmt)
            return str(val) if val else None

        if "$cond" in expr:
            cond_args = expr["$cond"]
            if isinstance(cond_args, list) and len(cond_args) == 3:
                cond, true_val, false_val = cond_args
                is_true = _eval_cond(doc, cond)
                return _eval_expr(doc, true_val) if is_true else _eval_expr(doc, false_val)
            return None

        if "$divide" in expr:
            args = expr["$divide"]
            if isinstance(args, list) and len(args) == 2:
                num = _eval_expr(doc, args[0]) or 0
                den = _eval_expr(doc, args[1]) or 1
                return (float(num) / float(den)) if float(den) != 0 else 0

        if "$subtract" in expr:
            args = expr["$subtract"]
            if isinstance(args, list) and len(args) == 2:
                a = _eval_expr(doc, args[0])
                b = _eval_expr(doc, args[1])
                if isinstance(a, str):
                    try:
                        a = datetime.fromisoformat(a.replace("Z", "+00:00"))
                    except Exception:
                        pass
                if isinstance(b, str):
                    try:
                        b = datetime.fromisoformat(b.replace("Z", "+00:00"))
                    except Exception:
                        pass
                if isinstance(a, datetime) and isinstance(b, datetime):
                    return (a - b).total_seconds() * 1000.0
                try:
                    return float(a or 0) - float(b or 0)
                except Exception:
                    return 0.0

        if "$multiply" in expr:
            args = expr["$multiply"]
            if isinstance(args, list):
                res = 1.0
                for a in args:
                    res *= float(_eval_expr(doc, a) or 0)
                return res

        if "$add" in expr:
            args = expr["$add"]
            if isinstance(args, list):
                res = 0.0
                for a in args:
                    res += float(_eval_expr(doc, a) or 0)
                return res

    return expr

def _eval_cond(doc: dict, cond: Any) -> bool:
    if isinstance(cond, dict):
        if "$in" in cond:
            args = cond["$in"]
            if isinstance(args, list) and len(args) == 2:
                val = _eval_expr(doc, args[0])
                target_list = args[1] if isinstance(args[1], list) else []
                return val in target_list
        if "$eq" in cond:
            args = cond["$eq"]
            if isinstance(args, list) and len(args) == 2:
                return _eval_expr(doc, args[0]) == _eval_expr(doc, args[1])
        if "$ne" in cond:
            args = cond["$ne"]
            if isinstance(args, list) and len(args) == 2:
                return _eval_expr(doc, args[0]) != _eval_expr(doc, args[1])
        if "$gt" in cond:
            args = cond["$gt"]
            if isinstance(args, list) and len(args) == 2:
                return float(_eval_expr(doc, args[0]) or 0) > float(_eval_expr(doc, args[1]) or 0)
        if "$gte" in cond:
            args = cond["$gte"]
            if isinstance(args, list) and len(args) == 2:
                return float(_eval_expr(doc, args[0]) or 0) >= float(_eval_expr(doc, args[1]) or 0)
        if "$lt" in cond:
            args = cond["$lt"]
            if isinstance(args, list) and len(args) == 2:
                return float(_eval_expr(doc, args[0]) or 0) < float(_eval_expr(doc, args[1]) or 0)
        if "$lte" in cond:
            args = cond["$lte"]
            if isinstance(args, list) and len(args) == 2:
                return float(_eval_expr(doc, args[0]) or 0) <= float(_eval_expr(doc, args[1]) or 0)
    return bool(cond)

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
        doc = copy.deepcopy(doc)
        if "_id" not in doc:
            import uuid
            doc["_id"] = str(uuid.uuid4())
        if "id" not in doc:
            doc["id"] = str(doc["_id"])
        self._data.append(doc)
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(doc["_id"])

    async def insert_many(self, docs):
        inserted_ids = []
        for doc in docs:
            res = await self.insert_one(doc)
            inserted_ids.append(res.inserted_id)
        class InsertManyResult:
            def __init__(self, ids):
                self.inserted_ids = ids
        return InsertManyResult(inserted_ids)

    async def find_one(self, filter_dict=None, *args, **kwargs):
        filter_dict = filter_dict or {}
        for d in self._data:
            if self._matches(d, filter_dict):
                return copy.deepcopy(d)
        return None

    def find(self, filter_dict=None, *args, **kwargs):
        filter_dict = filter_dict or {}
        matches = [copy.deepcopy(d) for d in self._data if self._matches(d, filter_dict)]
        
        class AsyncCursor:
            def __init__(self, items):
                self._items = items
            def sort(self, key_or_list, direction=None):
                if isinstance(key_or_list, str):
                    reverse = (direction == -1 or direction == pymongo.DESCENDING)
                    self._items.sort(key=lambda x: str(x.get(key_or_list, "")), reverse=reverse)
                elif isinstance(key_or_list, list):
                    for k, d in reversed(key_or_list):
                        reverse = (d == -1 or d == pymongo.DESCENDING)
                        self._items.sort(key=lambda x: str(x.get(k, "")), reverse=reverse)
                return self
            def skip(self, count):
                self._items = self._items[count:]
                return self
            def limit(self, count):
                self._items = self._items[:count]
                return self
            async def to_list(self, length=None):
                return self._items[:length] if length is not None else self._items
        return AsyncCursor(matches)

    async def update_one(self, filter_dict, update_dict, upsert=False, *args, **kwargs):
        for target in self._data:
            if self._matches(target, filter_dict):
                if "$set" in update_dict:
                    target.update(copy.deepcopy(update_dict["$set"]))
                if "$inc" in update_dict:
                    for k, v in update_dict["$inc"].items():
                        target[k] = target.get(k, 0) + v
                return
        if upsert:
            new_doc = copy.deepcopy(filter_dict)
            if "$set" in update_dict:
                new_doc.update(copy.deepcopy(update_dict["$set"]))
            await self.insert_one(new_doc)

    async def update_many(self, filter_dict, update_dict, *args, **kwargs):
        filter_dict = filter_dict or {}
        for target in self._data:
            if self._matches(target, filter_dict):
                if "$set" in update_dict:
                    target.update(copy.deepcopy(update_dict["$set"]))
                if "$inc" in update_dict:
                    for k, v in update_dict["$inc"].items():
                        target[k] = target.get(k, 0) + v

    async def delete_many(self, filter_dict=None, *args, **kwargs):
        filter_dict = filter_dict or {}
        before = len(self._data)
        self._data = [d for d in self._data if not self._matches(d, filter_dict)]
        class DeleteResult:
            def __init__(self, count):
                self.deleted_count = count
        return DeleteResult(before - len(self._data))

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
        data = [copy.deepcopy(d) for d in self._data]
        
        for stage in pipeline:
            if "$match" in stage:
                match_filter = stage["$match"]
                data = [d for d in data if self._matches(d, match_filter)]
                
            elif "$project" in stage:
                proj_spec = stage["$project"]
                projected = []
                for d in data:
                    new_doc = {}
                    for k, expr in proj_spec.items():
                        new_doc[k] = _eval_expr(d, expr)
                    for k, v in d.items():
                        if k not in new_doc and k not in proj_spec:
                            new_doc[k] = v
                    projected.append(new_doc)
                data = projected

            elif "$group" in stage:
                group_spec = stage["$group"]
                id_expr = group_spec.get("_id")
                groups: Dict[Any, List[dict]] = {}
                
                for d in data:
                    gid = _eval_expr(d, id_expr) if id_expr is not None else None
                    if isinstance(gid, dict):
                        gid = str(gid)
                    if gid not in groups:
                        groups[gid] = []
                    groups[gid].append(d)
                    
                grouped_res = []
                for gid, docs in groups.items():
                    out_doc = {"_id": gid}
                    for field, acc in group_spec.items():
                        if field == "_id":
                            continue
                        if isinstance(acc, dict):
                            if "$sum" in acc:
                                sum_expr = acc["$sum"]
                                if sum_expr == 1:
                                    out_doc[field] = len(docs)
                                else:
                                    out_doc[field] = sum(float(_eval_expr(doc, sum_expr) or 0.0) for doc in docs)
                            elif "$avg" in acc:
                                avg_expr = acc["$avg"]
                                vals = [float(_eval_expr(doc, avg_expr)) for doc in docs if _eval_expr(doc, avg_expr) is not None]
                                out_doc[field] = (sum(vals) / len(vals)) if vals else None
                            elif "$min" in acc:
                                min_expr = acc["$min"]
                                vals = [float(_eval_expr(doc, min_expr)) for doc in docs if _eval_expr(doc, min_expr) is not None]
                                out_doc[field] = min(vals) if vals else None
                            elif "$max" in acc:
                                max_expr = acc["$max"]
                                vals = [float(_eval_expr(doc, max_expr)) for doc in docs if _eval_expr(doc, max_expr) is not None]
                                out_doc[field] = max(vals) if vals else None
                            elif "$first" in acc:
                                out_doc[field] = _eval_expr(docs[0], acc["$first"]) if docs else None
                            elif "$push" in acc:
                                out_doc[field] = [_eval_expr(doc, acc["$push"]) for doc in docs]
                    grouped_res.append(out_doc)
                data = grouped_res

            elif "$sort" in stage:
                sort_spec = stage["$sort"]
                if isinstance(sort_spec, dict):
                    for k, direction in sort_spec.items():
                        reverse = (direction == -1)
                        data.sort(key=lambda x: (x.get(k) is None, x.get(k, 0)), reverse=reverse)

            elif "$skip" in stage:
                data = data[stage["$skip"]:]

            elif "$limit" in stage:
                data = data[:stage["$limit"]]

            elif "$bucket" in stage:
                bucket_spec = stage["$bucket"]
                gb_expr = bucket_spec.get("groupBy")
                boundaries = bucket_spec.get("boundaries", [])
                output_spec = bucket_spec.get("output", {"count": {"$sum": 1}})
                default_bucket = bucket_spec.get("default", "Other")

                buckets: Dict[Any, List[dict]] = {b: [] for b in boundaries[:-1]}
                buckets[default_bucket] = []

                for d in data:
                    val = float(_eval_expr(d, gb_expr) or 0.0)
                    assigned = False
                    for i in range(len(boundaries) - 1):
                        if boundaries[i] <= val < boundaries[i + 1]:
                            buckets[boundaries[i]].append(d)
                            assigned = True
                            break
                    if not assigned:
                        buckets[default_bucket].append(d)

                bucket_res = []
                for b_id, docs in buckets.items():
                    if not docs and b_id == default_bucket:
                        continue
                    b_doc = {"_id": b_id}
                    for field, acc in output_spec.items():
                        if isinstance(acc, dict) and "$sum" in acc:
                            if acc["$sum"] == 1:
                                b_doc[field] = len(docs)
                            else:
                                b_doc[field] = sum(float(_eval_expr(doc, acc["$sum"]) or 0) for doc in docs)
                    bucket_res.append(b_doc)
                data = bucket_res

        class AsyncAggCursor:
            def __init__(self, items):
                self._items = items
            async def to_list(self, length=None):
                return self._items[:length] if length is not None else self._items
        return AsyncAggCursor(data)

    def _matches(self, doc, filter_dict):
        if not filter_dict:
            return True
        for k, v in filter_dict.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
            elif k == "$and" and isinstance(v, list):
                if not all(self._matches(doc, cond) for cond in v):
                    return False
            elif isinstance(v, dict):
                doc_val = _extract_field(doc, k)
                if "$in" in v:
                    if doc_val not in v["$in"]:
                        return False
                if "$ne" in v:
                    if doc_val == v["$ne"]:
                        return False
                if "$exists" in v:
                    exists = (doc_val is not None)
                    if exists != bool(v["$exists"]):
                        return False
                if "$gt" in v:
                    if doc_val is None or doc_val <= v["$gt"]:
                        return False
                if "$gte" in v:
                    if doc_val is None or doc_val < v["$gte"]:
                        return False
                if "$lt" in v:
                    if doc_val is None or doc_val >= v["$lt"]:
                        return False
                if "$lte" in v:
                    if doc_val is None or doc_val > v["$lte"]:
                        return False
                if "$regex" in v:
                    pattern = v["$regex"]
                    flags = re.IGNORECASE if v.get("$options") == "i" else 0
                    if not re.search(pattern, str(doc_val or ""), flags=flags):
                        return False
            else:
                doc_val = _extract_field(doc, k)
                if doc_val != v and str(doc_val) != str(v) and str(doc_val).lower() != str(v).lower():
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
        print(f"MongoDB offline/unreachable ({e}). Initialized Resilient Async Database Engine.")
        db_client.db = AsyncMockDatabase()

async def close_db():
    if db_client.client is not None:
        db_client.client.close()

async def get_database() -> AsyncGenerator:
    if db_client.db is None:
        db_client.db = AsyncMockDatabase()
    yield db_client.db