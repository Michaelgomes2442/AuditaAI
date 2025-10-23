"""
BEN Event Processing Core
Version: Band-1.3 (vΩ.9)
"""

import hashlib
from datetime import datetime
from typing import Dict, Optional

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ed25519

from .types import BaseReceipt, BandLevel, Track, ReceiptType


class BENEventProcessor:
    """Core event processor for the Blockchain Event Network"""
    
    def __init__(self):
        self._lamport_clock: int = 0
        self._last_digest: Optional[str] = None
        self._private_key = ed25519.Ed25519PrivateKey.generate()
        self._public_key = self._private_key.public_key()

    def get_lamport(self) -> int:
        """Get current Lamport clock value"""
        return self._lamport_clock

    def increment_lamport(self) -> int:
        """Increment Lamport clock"""
        self._lamport_clock += 1
        return self._lamport_clock

    def compute_hash(self, content: str) -> str:
        """Compute SHA-256 hash of content"""
        return hashlib.sha256(content.encode()).hexdigest()

    def sign_receipt(self, receipt: BaseReceipt) -> str:
        """Sign receipt with Ed25519"""
        signature = self._private_key.sign(
            f"{receipt.receipt_type}:{receipt.lamport}:{receipt.prev_digest}".encode()
        )
        return signature.hex()

    def verify_signature(self, receipt: BaseReceipt) -> bool:
        """Verify receipt signature"""
        if not receipt.actor_signature:
            return False
            
        try:
            signature_bytes = bytes.fromhex(receipt.actor_signature)
            self._public_key.verify(
                signature_bytes,
                f"{receipt.receipt_type}:{receipt.lamport}:{receipt.prev_digest}".encode()
            )
            return True
        except Exception:
            return False

    def create_receipt(
        self,
        receipt_type: ReceiptType,
        band: BandLevel,
        track: Track,
        trace_id: str,
        **kwargs
    ) -> BaseReceipt:
        """Create a new signed receipt"""
        
        # Increment Lamport clock
        lamport = self.increment_lamport()
        
        # Create receipt
        receipt = BaseReceipt(
            receipt_type=receipt_type,
            lamport=lamport,
            prev_digest=self._last_digest,
            trace_id=trace_id,
            band=band,
            track=track,
            timestamp=datetime.utcnow(),
            **kwargs
        )
        
        # Compute self hash
        content = f"{receipt.receipt_type}:{receipt.lamport}:{receipt.prev_digest}"
        receipt.self_hash = self.compute_hash(content)
        
        # Sign receipt
        receipt.actor_signature = self.sign_receipt(receipt)
        
        # Update last digest
        self._last_digest = receipt.self_hash
        
        return receipt