import os, json, hashlib
from cryptography.fernet import Fernet

APP_ROOT = os.path.expanduser("~/AuditaAI")
RECEIPTS_DIR = os.path.join(APP_ROOT, "receipts")
KEY_PATH = os.path.join(APP_ROOT, "ben_governance", "ben.key")

def load_key():
    return Fernet(open(KEY_PATH, "rb").read())

def decrypt(path: str) -> dict:
    f = load_key()
    return json.loads(f.decrypt(open(path, "rb").read()).decode())

def sha(r: dict) -> str:
    body = {k: v for k, v in r.items() if k != "self_hash"}
    return hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()

files = sorted([p for p in os.listdir(RECEIPTS_DIR) if p.endswith(".ben")])
assert files, "No receipts found"

prev_self = None
prev_lamport = None
ok = True

for fname in files:
    path = os.path.join(RECEIPTS_DIR, fname)
    r = decrypt(path)
    calc = sha(r)

    h_ok = (calc == r.get("self_hash"))
    chain_ok = (prev_self is None) or (r.get("prev_hash") == prev_self)
    lamport_ok = (prev_lamport is None) or (r.get("lamport_counter") == prev_lamport + 1)

    print(f"{fname}: hash_ok={h_ok} chain_ok={chain_ok} lamport_ok={lamport_ok} event={r.get('event')}")
    ok = ok and h_ok and chain_ok and lamport_ok

    prev_self = r.get("self_hash")
    prev_lamport = r.get("lamport_counter")

print("✅ CHAIN PASS" if ok else "❌ CHAIN FAIL")
