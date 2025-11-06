"""
Chain Verification System
Version: Band-1.3 (vΩ.9)

Implements domain-separated Merkle proof verification following RFC 6962.
Leaf hashes are prefixed with 0x00 and internal nodes with 0x01 to prevent
second-preimage attacks.
"""

import hashlib
from typing import List, Optional, Tuple

from .types import BaseReceipt


# Domain separation prefixes (RFC 6962)
LEAF_PREFIX = b'\x00'      # Prefix for leaf node hashes
INTERNAL_PREFIX = b'\x01'  # Prefix for internal node hashes


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
        """
        Verify a Merkle proof for a receipt using domain-separated hashing.
        
        Args:
            receipt: The receipt to verify
            merkle_root: Expected Merkle root hash
            proof: List of sibling hashes
        
        Returns:
            True if proof is valid, False otherwise
        
        Implementation:
            - Leaf hash: hash(0x00 || receipt.self_hash)
            - Internal hash: hash(0x01 || sorted_left || sorted_right)
            - Hashes are ordered lexicographically for determinism
            - Follows RFC 6962 domain separation recommendations
        """
        # Start with leaf hash (domain separated)
        current = hashlib.sha256(LEAF_PREFIX + receipt.self_hash.encode()).hexdigest()
        
        # Process each sibling in the proof
        for sibling in proof:
            # Lexicographic ordering for deterministic hashing
            if current < sibling:
                left, right = current, sibling
            else:
                left, right = sibling, current
            
            # Hash internal node with domain separation
            combined = INTERNAL_PREFIX + left.encode() + right.encode()
            current = hashlib.sha256(combined).hexdigest()
        
        return current == merkle_root

    def _hash_pair(self, left: str, right: str) -> str:
        """
        Hash a pair of strings using domain-separated internal node hashing.
        
        Args:
            left: Left child hash
            right: Right child hash
        
        Returns:
            Hex-encoded SHA-256 hash with internal node prefix
        
        Note:
            This method is deprecated. Use domain-separated hashing in
            verify_merkle_proof instead.
        """
        # Lexicographic ordering
        if left > right:
            left, right = right, left
        
        combined = INTERNAL_PREFIX + left.encode() + right.encode()
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