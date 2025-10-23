from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os, json, hashlib
from cryptography.fernet import Fernet
from datetime import datetime
from typing import List

APP_ROOT = os.path.expanduser("~/AuditaAI")
RECEIPTS_DIR = os.path.join(APP_ROOT, "receipts")
KEY_PATH = os.path.join(APP_ROOT, "ben_governance", "ben.key")
REGISTRY_PATH = os.path.join(RECEIPTS_DIR, "registry.json")

app = FastAPI(title="BEN Audit Service", version="0.1.0")

def _load_key() -> Fernet:
    with open(KEY_PATH, "rb") as f:
        return Fernet(f.read())

def _decrypt(path: str) -> dict:
    f = _load_key()
    blob = f.decrypt(open(path, "rb").read()).decode()
    return json.loads(blob)

def _calc_hash(receipt: dict) -> str:
    payload = {k: v for k, v in receipt.items() if k != "self_hash"}
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

def _append_registry(entry: dict) -> None:
    os.makedirs(RECEIPTS_DIR, exist_ok=True)
    if os.path.exists(REGISTRY_PATH):
        try:
            reg = json.load(open(REGISTRY_PATH, "r"))
            if not isinstance(reg, list): reg = []
        except Exception:
            reg = []
    else:
        reg = []
    reg.append(entry)
    with open(REGISTRY_PATH, "w") as w:
        json.dump(reg, w, indent=2)

@app.get("/health")
def health():
    return {"ok": True, "time": datetime.utcnow().isoformat() + "Z"}

@app.get("/list")
def list_receipts() -> List[str]:
    files = sorted([p for p in os.listdir(RECEIPTS_DIR) if p.endswith(".ben")])
    return files

class VerifyPathIn(BaseModel):
    path: str

@app.post("/verify-path")
def verify_path(body: VerifyPathIn):
    path = body.path
    if not os.path.isabs(path):
        path = os.path.join(RECEIPTS_DIR, path)
    if not os.path.exists(path):
        return JSONResponse({"verified": False, "error": "file_not_found", "path": path}, status_code=404)

    rec = _decrypt(path)
    calc = _calc_hash(rec)
    verified = (calc == rec.get("self_hash"))

    entry = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "path": path,
        "event": rec.get("event"),
        "lamport": rec.get("lamport_counter"),
        "self_hash": rec.get("self_hash"),
        "calc_hash": calc,
        "verified": verified,
    }
    _append_registry(entry)
    return entry

@app.post("/verify-file")
async def verify_file(file: UploadFile = File(...)):
    # Save temp, verify, then remove
    tmp_path = os.path.join(RECEIPTS_DIR, f"__upload__{file.filename}")
    os.makedirs(RECEIPTS_DIR, exist_ok=True)
    with open(tmp_path, "wb") as w:
        w.write(await file.read())

    try:
        rec = _decrypt(tmp_path)
        calc = _calc_hash(rec)
        verified = (calc == rec.get("self_hash"))
        entry = {
            "ts": datetime.utcnow().isoformat() + "Z",
            "path": tmp_path,
            "event": rec.get("event"),
            "lamport": rec.get("lamport_counter"),
            "self_hash": rec.get("self_hash"),
            "calc_hash": calc,
            "verified": verified,
        }
        _append_registry(entry)
        return entry
    finally:
        try: os.remove(tmp_path)
        except Exception: pass

@app.get("/registry")
def registry():
    if os.path.exists(REGISTRY_PATH):
        try:
            return json.load(open(REGISTRY_PATH, "r"))
        except Exception:
            return []
    return []
