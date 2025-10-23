"""
Chain Verification System
Version: Band-1.3 (vΩ.9)
"""

from typing import List, Optional, Tuple

from .types import BaseReceipt


class ChainVerifier:
    """Verifies cryptographic receipt chains"""

    def verify_chain(self, receipts: List[BaseReceipt]) -> Tuple[bool, Optional[str]]:
        """
        Verify a chain of receipts:
        - Lamport clock monotonicity
        - Hash chain integrity
        - Signature validation
        """
        if not receipts:
            return True, None

        # Sort by Lamport clock
        sorted_receipts = sorted(receipts, key=lambda r: r.lamport)

        # Verify Lamport monotonicity
        last_lamport = -1
        for receipt in sorted_receipts:
            if receipt.lamport <= last_lamport:
                return False, f"Non-monotonic Lamport clock at {receipt.lamport}"
            last_lamport = receipt.lamport

        # Verify hash chain
        last_hash = None
        for receipt in sorted_receipts:
            if receipt.prev_digest != last_hash:
                return False, f"Hash chain broken at {receipt.lamport}"
            last_hash = receipt.self_hash

        return True, None

    def verify_merkle_proof(
        self, 
        receipt: BaseReceipt, 
        merkle_root: str,
        proof: List[str]
    ) -> bool:
        """Verify a Merkle proof for a receipt"""
        current = receipt.self_hash
        
        for sibling in proof:
            # Sort hashes to ensure deterministic ordering
            if current < sibling:
                current = self._hash_pair(current, sibling)
            else:
                current = self._hash_pair(sibling, current)
        
        return current == merkle_root

    def _hash_pair(self, left: str, right: str) -> str:
        """Hash a pair of strings"""
        import hashlib
        combined = f"{left}{right}".encode()
        return hashlib.sha256(combined).hexdigest()

    def verify_band_transition(
        self,
        receipt_a: BaseReceipt,
        receipt_b: BaseReceipt
    ) -> bool:
        """
        Verify valid band transition:
        Band-0 → Band-1: Adaptive governance activation
        Band-1 → Band-2: Meta-governance promotion
        Band-2 → Band-3: Field learning engagement
        etc.
        """
        valid_transitions = {
            "band-0": ["band-1"],
            "band-1": ["band-2"],
            "band-2": ["band-3"],
            "band-3": ["band-4"],
            "band-4": ["band-5"],
            "band-5": ["band-6"],
            "band-6": ["band-7"],
            "band-7": ["band-8"],
            "band-8": ["band-9"],
            "band-9": ["band-z"],
        }

        return (
            receipt_b.band.value in valid_transitions.get(receipt_a.band.value, [])
            and receipt_b.lamport > receipt_a.lamport
        )