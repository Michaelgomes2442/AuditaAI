import os, json, hashlib
from cryptography.fernet import Fernet
from path_utils import KEY_PATH, RECEIPTS_DIR

print("🔍 Loading key and receipts...")
print("Looking in:", RECEIPTS_DIR)

with open(KEY_PATH, "rb") as f:
    key = f.read()
f = Fernet(key)

files = [p for p in os.listdir(RECEIPTS_DIR) if p.endswith(".ben")]
print("Found files:", files)
if not files:
    raise SystemExit("❌ No receipts found")

path = os.path.join(RECEIPTS_DIR, sorted(files)[-1])
print("Verifying:", path)

blob = f.decrypt(open(path, "rb").read()).decode()
receipt = json.loads(blob)

calc = hashlib.sha256(
    json.dumps({k: v for k, v in receipt.items() if k != "self_hash"}, sort_keys=True).encode()
).hexdigest()

print("\nStored self_hash:", receipt["self_hash"])
print("Calculated     :", calc)
print("✅ PASS" if calc == receipt["self_hash"] else "❌ FAIL")
