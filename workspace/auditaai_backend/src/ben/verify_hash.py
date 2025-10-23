"""
Hash Verification System
Version: Band-1.3 (vΩ.9)
"""

import hashlib
from typing import Dict, List, Optional, Union

from pydantic import BaseModel

from .types import BaseReceipt


class HashVerification(BaseModel):
    """Hash verification result"""
    is_valid: bool
    error: Optional[str] = None
    computed_hash: str
    expected_hash: str

class HashVerifier:
    """Performs hash integrity checks"""

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
    def compute_merkle_root(items: List[Union[str, BaseReceipt]]) -> str:
        """Compute Merkle root from list of items"""
        if not items:
            return hashlib.sha256(b"").hexdigest()

        # Convert receipts to hashes if needed
        leaves = [
            item if isinstance(item, str) else item.self_hash
            for item in items
        ]

        # Handle odd number of leaves
        if len(leaves) % 2 == 1:
            leaves.append(leaves[-1])

        while len(leaves) > 1:
            temp = []
            for i in range(0, len(leaves), 2):
                combined = f"{leaves[i]}{leaves[i+1]}".encode()
                temp.append(hashlib.sha256(combined).hexdigest())
            leaves = temp

        return leaves[0]

    @staticmethod
    def generate_merkle_proof(
        items: List[Union[str, BaseReceipt]],
        target_hash: str
    ) -> List[str]:
        """Generate Merkle proof for target hash"""
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

        proof = []
        while len(leaves) > 1:
            temp = []
            for i in range(0, len(leaves), 2):
                if i + 1 >= len(leaves):
                    temp.append(leaves[i])
                    if i == target_idx:
                        target_idx = len(temp) - 1
                    continue

                if i == target_idx:
                    proof.append(leaves[i + 1])
                    target_idx = len(temp)
                elif i + 1 == target_idx:
                    proof.append(leaves[i])
                    target_idx = len(temp)

                combined = f"{leaves[i]}{leaves[i+1]}".encode()
                temp.append(hashlib.sha256(combined).hexdigest())
            leaves = temp

        return proof