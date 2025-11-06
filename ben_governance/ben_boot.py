import os, json, hashlib, time
from datetime import datetime
from cryptography.fernet import Fernet
from path_utils import RECEIPTS_DIR, KEY_PATH

# === BOOT: Load or create key ===
if not os.path.exists(KEY_PATH):
    # Ensure directory exists
    os.makedirs(os.path.dirname(KEY_PATH), exist_ok=True)
    key = Fernet.generate_key()
    with open(KEY_PATH, "wb") as f:
        f.write(key)
    print("🔑 New BEN key created.")
else:
    with open(KEY_PATH, "rb") as f:
        key = f.read()

f = Fernet(key)

# === BOOT: Generate first governance receipt ===
os.makedirs(RECEIPTS_DIR, exist_ok=True)
receipt = {
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "event": "Δ-BOOTCONFIRM",
    "system": os.uname().nodename,
    "lamport_counter": 1,
    "message": "BEN Core initialized successfully.",
}

digest = hashlib.sha256(json.dumps(receipt, sort_keys=True).encode()).hexdigest()
receipt["self_hash"] = digest

# === Encrypt + store ===
token = f.encrypt(json.dumps(receipt).encode())
path = os.path.join(RECEIPTS_DIR, f"receipt_boot_{int(time.time())}.ben")

with open(path, "wb") as out:
    out.write(token)

print(f"✅ Governance receipt generated:\n{path}")
