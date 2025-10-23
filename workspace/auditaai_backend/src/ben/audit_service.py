"""
Central Governance and Receipt Dispatcher
Version: Band-1.3 (vΩ.9)
"""

from datetime import datetime
from typing import List, Optional

from prisma import Prisma
from pydantic import BaseModel

from .ben_event import BENEventProcessor
from .ben_boot import BENBootSystem, RuntimeConfig
from .types import (
    BaseReceipt,
    BandLevel,
    Track,
    ReceiptType,
    CRIESMetrics,
    StabilityMetrics
)
from .verify_chain import ChainVerifier
from .verify_hash import HashVerifier


class AuditService:
    """Central audit service for governance and receipt management"""

    def __init__(self):
        self.event_processor = BENEventProcessor()
        self.boot_system = BENBootSystem()
        self.chain_verifier = ChainVerifier()
        self.hash_verifier = HashVerifier()
        self.db = Prisma()
        self._current_cries: Optional[CRIESMetrics] = None
        self._current_stability: Optional[StabilityMetrics] = None

    async def initialize(self, config: RuntimeConfig):
        """Initialize the audit service"""
        # Initialize BEN system
        await self.boot_system.initialize(config)
        
        # Connect to database
        await self.db.connect()

    async def process_event(
        self,
        receipt_type: ReceiptType,
        band: BandLevel,
        track: Track,
        trace_id: str,
        **kwargs
    ) -> BaseReceipt:
        """Process an event and create a receipt"""
        # Create receipt
        receipt = self.event_processor.create_receipt(
            receipt_type=receipt_type,
            band=band,
            track=track,
            trace_id=trace_id,
            **kwargs
        )

        # Store in database
        await self.db.receipt.create(
            data={
                "receipt_type": receipt.receipt_type.value,
                "lamport": receipt.lamport,
                "prev_digest": receipt.prev_digest,
                "self_hash": receipt.self_hash,
                "trace_id": receipt.trace_id,
                "timestamp": receipt.timestamp,
                "actor_signature": receipt.actor_signature,
                "band": receipt.band.value,
                "track": receipt.track.value,
            }
        )

        # Update CRIES metrics if needed
        if receipt_type in [
            ReceiptType.WITNESS_CLAIM,
            ReceiptType.WITNESS_CONSENSUS,
            ReceiptType.RISK_GATE
        ]:
            await self._update_cries_metrics()

        return receipt

    async def verify_receipt_chain(
        self,
        start_lamport: int,
        end_lamport: int
    ) -> bool:
        """Verify receipt chain between Lamport clocks"""
        receipts = await self.db.receipt.find_many(
            where={
                "lamport": {
                    "gte": start_lamport,
                    "lte": end_lamport
                }
            },
            order={"lamport": "asc"}
        )

        # Convert to BaseReceipt objects
        receipt_objects = [
            BaseReceipt(
                receipt_type=ReceiptType(r.receipt_type),
                lamport=r.lamport,
                prev_digest=r.prev_digest,
                self_hash=r.self_hash,
                trace_id=r.trace_id,
                timestamp=r.timestamp,
                actor_signature=r.actor_signature,
                band=BandLevel(r.band),
                track=Track(r.track)
            )
            for r in receipts
        ]

        is_valid, error = self.chain_verifier.verify_chain(receipt_objects)
        if not is_valid:
            raise ValueError(f"Chain verification failed: {error}")

        return True

    async def get_cries_metrics(self) -> CRIESMetrics:
        """Get current CRIES metrics"""
        if not self._current_cries:
            await self._update_cries_metrics()
        return self._current_cries

    async def get_stability_metrics(self) -> StabilityMetrics:
        """Get current stability metrics"""
        if not self._current_stability:
            await self._update_stability_metrics()
        return self._current_stability

    async def _update_cries_metrics(self):
        """Update CRIES metrics based on recent receipts"""
        # Get recent receipts for analysis
        recent_receipts = await self.db.receipt.find_many(
            order={"lamport": "desc"},
            take=100  # Analyze last 100 receipts
        )

        # Initialize metrics
        clarity = reliability = integrity = efficiency = safety = 1.0
        
        for receipt in recent_receipts:
            # Update reliability based on hash verification
            if HashVerifier.verify_receipt_hash(
                BaseReceipt(
                    receipt_type=ReceiptType(receipt.receipt_type),
                    lamport=receipt.lamport,
                    prev_digest=receipt.prev_digest,
                    self_hash=receipt.self_hash,
                    trace_id=receipt.trace_id,
                    timestamp=receipt.timestamp,
                    actor_signature=receipt.actor_signature,
                    band=BandLevel(receipt.band),
                    track=Track(receipt.track)
                )
            ).is_valid:
                reliability *= 0.99  # Small penalty for any verification issue
            
            # Update safety based on risk gates
            if receipt.receipt_type == ReceiptType.RISK_GATE.value:
                safety *= 0.95  # Significant safety impact
                
            # Integrity based on signature verification
            if not receipt.actor_signature:
                integrity *= 0.90

        # Store updated metrics
        self._current_cries = CRIESMetrics(
            clarity=clarity,
            reliability=reliability,
            integrity=integrity,
            efficiency=efficiency,
            safety=safety
        )

    async def _update_stability_metrics(self):
        """Update tri-actor stability metrics"""
        config = self.boot_system.get_runtime_config()
        if not config:
            raise RuntimeError("BEN system not initialized")

        # Get track-specific receipts
        track_receipts = {
            track: await self.db.receipt.count(
                where={"track": track.value}
            )
            for track in Track
        }

        total_receipts = sum(track_receipts.values())
        if total_receipts == 0:
            return

        # Calculate sigma_t (stability metric)
        sigma_t = sum(
            config.track_weights[track] * (count / total_receipts)
            for track, count in track_receipts.items()
        )

        # Update stability metrics
        self._current_stability = StabilityMetrics(
            sigma_t=sigma_t,
            omega_t=1.0,  # System state (simplified)
            eta=0.1,  # Learning rate
            gamma_b=0.2,  # Governance dampening
            weights=config.track_weights
        )