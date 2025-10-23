"""
BEN Boot System - Initializes Lamport chain & governance runtime
Version: Band-1.3 (vΩ.9)
"""

import logging
from typing import Dict, List, Optional

from pydantic import BaseModel

from .ben_event import BENEventProcessor
from .types import BandLevel, Track, ReceiptType, BaseReceipt

class RuntimeConfig(BaseModel):
    """Runtime configuration for BEN system"""
    active_bands: List[BandLevel]
    track_weights: Dict[Track, float]
    stability_threshold: float = 0.7
    cries_threshold: float = 0.7
    max_unverified_citations: int = 5
    hitl_block_threshold: float = 0.7

class BENBootSystem:
    """Boot system for BEN Core"""
    
    def __init__(self):
        self.event_processor = BENEventProcessor()
        self.logger = logging.getLogger("ben.boot")
        self._runtime_config: Optional[RuntimeConfig] = None
        self._is_initialized = False

    async def initialize(self, config: RuntimeConfig) -> BaseReceipt:
        """Initialize the BEN system"""
        if self._is_initialized:
            raise RuntimeError("BEN system already initialized")

        # Validate track weights
        total_weight = sum(config.track_weights.values())
        if not 0.99 <= total_weight <= 1.01:  # Allow small floating point variance
            raise ValueError("Track weights must sum to 1.0")

        # Create genesis receipt
        genesis_receipt = self.event_processor.create_receipt(
            receipt_type=ReceiptType.MERKLE_ROOT,
            band=BandLevel.BAND_0,
            track=Track.TRACK_A,
            trace_id="BEN_GENESIS",
            prev_digest=None,  # Genesis has no previous digest
        )

        self._runtime_config = config
        self._is_initialized = True
        
        self.logger.info(
            "BEN Core initialized - Band-1.3 (vΩ.9)\n"
            f"Active Bands: {[band.value for band in config.active_bands]}\n"
            f"Track Weights: {config.track_weights}\n"
            f"Genesis Receipt: {genesis_receipt.self_hash}"
        )

        return genesis_receipt

    def validate_runtime_state(self) -> bool:
        """Validate the current runtime state"""
        if not self._is_initialized or not self._runtime_config:
            return False

        # Verify track weights
        weights = self._runtime_config.track_weights
        total = sum(weights.values())
        if not 0.99 <= total <= 1.01:
            self.logger.error(f"Invalid track weights: {weights} (sum={total})")
            return False

        # Verify Lamport chain
        current_lamport = self.event_processor.get_lamport()
        if current_lamport < 0:
            self.logger.error(f"Invalid Lamport clock: {current_lamport}")
            return False

        return True

    def get_runtime_config(self) -> Optional[RuntimeConfig]:
        """Get current runtime configuration"""
        return self._runtime_config

    def is_initialized(self) -> bool:
        """Check if BEN system is initialized"""
        return self._is_initialized