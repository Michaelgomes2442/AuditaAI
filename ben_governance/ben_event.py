import os, json, hashlib, time
from datetime import datetime
from cryptography.fernet import Fernet

APP_ROOT = os.path.expanduser("~/AuditaAI")
RECEIPTS_DIR = os.path.join(APP_ROOT, "receipts")
KEY_PATH = os.path.join(APP_ROOT, "ben_governance", "ben.key")
STATE_PATH = os.path.join(RECEIPTS_DIR, "state.json")

def load_key() -> Fernet:
    with open(KEY_PATH, "rb") as f:
        return Fernet(f.read())

def latest_receipt_path():
    files = sorted([p for p in os.listdir(RECEIPTS_DIR) if p.endswith(".ben")])
    if not files: return None
    return os.path.join(RECEIPTS_DIR, files[-1])

def decrypt(path: str) -> dict:
    f = load_key()
    return json.loads(f.decrypt(open(path, "rb").read()).decode())

def sha(payload: dict) -> str:
    body = {k: v for k, v in payload.items() if k != "self_hash"}
    return hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()

def load_state():
    if os.path.exists(STATE_PATH):
        return json.load(open(STATE_PATH, "r"))
    last = latest_receipt_path()
    if last:
        r = decrypt(last)
        return {"lamport": r.get("lamport_counter", 1), "prev_hash": r.get("self_hash")}
    return {"lamport": 1, "prev_hash": None}

def save_state(state):
    with open(STATE_PATH, "w") as w: json.dump(state, w, indent=2)

def create_event(event_name: str, message: str):
    os.makedirs(RECEIPTS_DIR, exist_ok=True)
    state = load_state()
    lamport = state["lamport"] + 1

    receipt = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event": event_name,                # e.g., "Δ-SYNCPOINT"
        "system": os.uname().nodename,
        "lamport_counter": lamport,
        "prev_hash": state["prev_hash"],    # chain pointer
        "message": message,
    }
    digest = sha(receipt)
    receipt["self_hash"] = digest

    f = load_key()
    token = f.encrypt(json.dumps(receipt).encode())
    out_path = os.path.join(RECEIPTS_DIR, f"receipt_{event_name}_{int(time.time())}.ben")
    with open(out_path, "wb") as w:
        w.write(token)

    state["lamport"] = lamport
    state["prev_hash"] = digest
    save_state(state)
    print(f"✅ Event receipt written: {out_path}")

if __name__ == "__main__":
    create_event("Δ-SYNCPOINT", "Milestone checkpoint recorded.")
