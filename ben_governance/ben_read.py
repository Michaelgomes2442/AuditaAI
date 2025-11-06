import os, json
from cryptography.fernet import Fernet
from path_utils import KEY_PATH, RECEIPTS_DIR

with open(KEY_PATH,"rb") as f: key = f.read()
f = Fernet(key)

# pick the most recent .ben file
files = sorted([p for p in os.listdir(RECEIPTS_DIR) if p.endswith(".ben")])
assert files, "No receipts found"
path = os.path.join(RECEIPTS_DIR, files[-1])

with open(path,"rb") as r:
    data = f.decrypt(r.read()).decode()

print(data)
