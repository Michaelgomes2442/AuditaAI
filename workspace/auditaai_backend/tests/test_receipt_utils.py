from datetime import datetime, timezone

from ben.receipt_utils import canonicalize_receipt
from ben.types import BaseReceipt, ReceiptType, BandLevel, Track


def test_canonicalize_from_dict():
    r = {
        "type": ReceiptType.CONSENT_GRANT,
        "lamport": "42",
        "ts": datetime(2025, 10, 21, 12, 0, 0, tzinfo=timezone.utc),
        "prev_digest": None,
        "self_hash": "abc123",
        "trace_id": "t-1",
        "who": "operator:ben",
        "band": BandLevel.BAND_0,
        "track": Track.TRACK_A,
        "payload": {"k": "v"},
    }

    out = canonicalize_receipt(r)
    assert out["receipt_type"] == ReceiptType.CONSENT_GRANT
    assert out["lamport"] == 42
    assert out["timestamp"].endswith("Z")
    assert out["self_hash"] == "abc123"


def test_canonicalize_from_model():
    model = BaseReceipt(
        receipt_type=ReceiptType.ACT_REQUEST,
        lamport=7,
        prev_digest=None,
        self_hash="h",
        trace_id="t2",
        band=BandLevel.BAND_1,
        track=Track.TRACK_B,
        timestamp=datetime(2025, 10, 21, 12, 30, 0, tzinfo=timezone.utc),
    )

    out = canonicalize_receipt(model)
    assert out["receipt_type"] == ReceiptType.ACT_REQUEST
    assert out["lamport"] == 7
    assert "who" not in out
