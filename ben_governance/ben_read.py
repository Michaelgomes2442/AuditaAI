import os, json
from cryptography.fernet import Fernet

KEY_PATH = os.path.expanduser("~/AuditaAI/ben_governance/ben.key")
RECENTS = os.path.expanduser("~/AuditaAI/receipts")

with open(KEY_PATH,"rb") as f: key = f.read()
f = Fernet(key)

# pick the most recent .ben file
files = sorted([p for p in os.listdir(RECENTS) if p.endswith(".ben")])
assert files, "No receipts found"
path = os.path.join(RECENTS, files[-1])

with open(path,"rb") as r:
    data = f.decrypt(r.read()).decode()

print(data)
