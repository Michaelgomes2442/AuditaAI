"""
Hash Verification System
Version: Band-1.3 (vΩ.9)

Implements domain-separated hashing for Merkle trees following RFC 6962.
Leaf hashes are prefixed with 0x00 and internal nodes with 0x01 to prevent
second-preimage attacks.
"""

import hashlib
from typing import Dict, List, Optional, Union

from pydantic import BaseModel

from .types import BaseReceipt


# Domain separation prefixes (RFC 6962)
LEAF_PREFIX = b'\x00'      # Prefix for leaf node hashes
INTERNAL_PREFIX = b'\x01'  # Prefix for internal node hashes


class HashVerification(BaseModel):
    """Hash verification result"""
    is_valid: bool
    error: Optional[str] = None
    computed_hash: str
    expected_hash: str

class HashVerifier:
    """
    Performs hash integrity checks with domain-separated Merkle tree hashing.
    
    Implements RFC 6962 recommendations for preventing second-preimage attacks:
    - Leaf nodes: hash(0x00 || data)
    - Internal nodes: hash(0x01 || left_hash || right_hash)
    
    This ensures that an attacker cannot find a leaf node that hashes to the
    same value as an internal node, preventing tree manipulation attacks.
    """

    @staticmethod
    def verify_receipt_hash(receipt: BaseReceipt) -> HashVerification:
        """Verify the self_hash of a receipt"""
        content = f"{receipt.receipt_type}:{receipt.lamport}:{receipt.prev_digest}"
        computed_hash = hashlib.sha256(content.encode()).hexdigest()
        
        return HashVerification(
            is_valid=computed_hash == receipt.self_hash,
            computed_hash=computed_hash,
            expected_hash=receipt.self_hash,
            error=None if computed_hash == receipt.self_hash else "Hash mismatch"
        )

    @staticmethod
    def _hash_leaf(data: str) -> str:
        """
        Hash a leaf node with domain separation prefix.
        
        Args:
            data: The leaf data (typically a receipt hash)
        
        Returns:
            Hex-encoded SHA-256 hash with leaf prefix
        """
        return hashlib.sha256(LEAF_PREFIX + data.encode()).hexdigest()

    @staticmethod
    def _hash_internal(left: str, right: str) -> str:
        """
        Hash an internal node with domain separation prefix.
        
        Args:
            left: Left child hash
            right: Right child hash
        
        Returns:
            Hex-encoded SHA-256 hash with internal prefix
        
        Note:
            Hashes are ordered lexicographically for deterministic results.
        """
        # Lexicographic ordering for determinism
        if left > right:
            left, right = right, left
        
        combined = INTERNAL_PREFIX + left.encode() + right.encode()
        return hashlib.sha256(combined).hexdigest()

    @staticmethod
    def compute_merkle_root(items: List[Union[str, BaseReceipt]]) -> str:
        """
        Compute Merkle root from list of items using domain-separated hashing.
        
        Args:
            items: List of receipt hashes (strings) or BaseReceipt objects
        
        Returns:
            Hex-encoded Merkle root hash
        
        Implementation:
            - Leaf nodes are hashed with 0x00 prefix
            - Internal nodes are hashed with 0x01 prefix
            - Sibling hashes are ordered lexicographically
            - Odd-length levels duplicate the last node
        """
        if not items:
            return hashlib.sha256(LEAF_PREFIX).hexdigest()

        # Convert receipts to hashes if needed
        leaves = [
            item if isinstance(item, str) else item.self_hash
            for item in items
        ]

        # Hash leaves with domain separation
        hashes = [HashVerifier._hash_leaf(leaf) for leaf in leaves]

        # Build tree bottom-up
        while len(hashes) > 1:
            # Handle odd number of nodes
            if len(hashes) % 2 == 1:
                hashes.append(hashes[-1])

            temp = []
            for i in range(0, len(hashes), 2):
                parent = HashVerifier._hash_internal(hashes[i], hashes[i + 1])
                temp.append(parent)
            hashes = temp

        return hashes[0]

    @staticmethod
    def generate_merkle_proof(
        items: List[Union[str, BaseReceipt]],
        target_hash: str
    ) -> List[str]:
        """
        Generate Merkle proof for target hash using domain-separated hashing.
        
        Args:
            items: List of receipt hashes or BaseReceipt objects
            target_hash: The hash to generate proof for
        
        Returns:
            List of sibling hashes needed to verify inclusion
        
        Implementation:
            - Uses same domain separation as compute_merkle_root
            - Leaf nodes hashed with 0x00 prefix
            - Internal nodes hashed with 0x01 prefix
            - Sibling hashes ordered lexicographically
        """
        if not items:
            return []

        # Convert receipts to hashes
        leaves = [
            item if isinstance(item, str) else item.self_hash
            for item in items
        ]

        # Find target index
        try:
            target_idx = leaves.index(target_hash)
        except ValueError:
            return []

        # Hash leaves with domain separation
        hashes = [HashVerifier._hash_leaf(leaf) for leaf in leaves]
        
        proof = []
        current_idx = target_idx

        # Build proof by collecting sibling hashes
        while len(hashes) > 1:
            # Handle odd number of nodes
            if len(hashes) % 2 == 1:
                hashes.append(hashes[-1])

            temp = []
            new_idx = current_idx // 2

            for i in range(0, len(hashes), 2):
                if i == current_idx or i + 1 == current_idx:
                    # This is our node, collect sibling
                    sibling_idx = i + 1 if i == current_idx else i
                    if sibling_idx < len(hashes):
                        proof.append(hashes[sibling_idx])

                parent = HashVerifier._hash_internal(hashes[i], hashes[i + 1])
                temp.append(parent)

            hashes = temp
            current_idx = new_idx

        return proof