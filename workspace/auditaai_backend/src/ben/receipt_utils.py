from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

from pydantic import BaseModel

from .types import BaseReceipt


CANONICAL_ORDER: List[str] = [
    "receipt_type",
    "lamport",
    "timestamp",
    "prev_digest",
    "self_hash",
    "trace_id",
    "who",
    "band",
    "track",
    "payload",
    "notes",
]


def _iso8601z(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def canonicalize_receipt(obj: Any) -> Dict[str, Any]:
    """Return a canonical dict for a receipt-like object.

    Rules (from Rosetta v208/v271):
    - Field order per CANONICAL_ORDER
    - `timestamp` normalized to ISO8601Z
    - `lamport` as int
    - preserve unknown fields under `payload`
    """

    # Convert Pydantic/BaseReceipt
    if isinstance(obj, BaseModel):
        data = obj.model_dump()
    elif isinstance(obj, dict):
        data = dict(obj)
    else:
        # Try attrs
        data = obj.__dict__ if hasattr(obj, "__dict__") else dict(obj)

    out: Dict[str, Any] = {}

    # helpers
    ts = None
    if "timestamp" in data:
        ts = data.pop("timestamp")
    elif "ts" in data:
        ts = data.pop("ts")

    # lamport
    lam = data.pop("lamport", None)
    if lam is not None:
        try:
            lam = int(lam)
        except Exception:
            raise ValueError("lamport must be castable to int")

    # who
    who = data.pop("who", None)

    # payload & notes
    payload = data.pop("payload", None)
    notes = data.pop("notes", None)

    # receipt_type
    rtype = data.pop("receipt_type", None)
    if rtype is None and "type" in data:
        rtype = data.pop("type")

    # prev_digest/self_hash/trace_id/band/track
    prev = data.pop("prev_digest", None)
    sh = data.pop("self_hash", None)
    trace = data.pop("trace_id", None)
    band = data.pop("band", None)
    track = data.pop("track", None)

    # unknown fields go into payload (merge)
    remaining = data
    if payload is None:
        payload = {}
    if isinstance(payload, dict):
        payload = {**remaining, **payload}
    else:
        # embed remaining under '__meta'
        payload = {"__meta": remaining, "value": payload}

    # build ordered output
    values = {
        "receipt_type": rtype,
        "lamport": lam,
        "timestamp": _iso8601z(ts) if ts is not None else None,
        "prev_digest": prev,
        "self_hash": sh,
        "trace_id": trace,
        "who": who,
        "band": band,
        "track": track,
        "payload": payload,
        "notes": notes,
    }

    for k in CANONICAL_ORDER:
        if values.get(k) is not None:
            out[k] = values[k]

    return out
