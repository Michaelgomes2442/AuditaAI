"""
BEN Core Types - Blockchain Event Network
Version: Band-1.3 (vΩ.9)
"""

from datetime import datetime
from enum import Enum
from typing import Dict, Optional, Union

from pydantic import BaseModel, Field


class BandLevel(Enum):
    """Rosetta Monolith Band Hierarchy"""
    BAND_0 = "band-0"  # Rosetta Base
    BAND_1 = "band-1"  # Adaptive Governance
    BAND_2 = "band-2"  # Meta-Governance
    BAND_3 = "band-3"  # Field Learning
    BAND_4 = "band-4"  # Audit Mesh
    BAND_5 = "band-5"  # Risk Metrics
    BAND_6 = "band-6"  # Ethics Governor
    BAND_7 = "band-7"  # Self-Propagation
    BAND_8 = "band-8"  # Audit Mesh
    BAND_9 = "band-9"  # Autonomy Governor
    BAND_Z = "band-z"  # Legal Layer

class Track(Enum):
    """Tri-Track Integrity Model Tracks"""
    TRACK_A = "track-a"  # Analyst / BEN Core
    TRACK_B = "track-b"  # Governor / Verifier
    TRACK_C = "track-c"  # LLM Executor / Reasoner

class ReceiptType(Enum):
    """Core Receipt Types"""
    CONSENT_GRANT = "Δ-CONSENT-GRANT"
    CONSENT_REVOKE = "Δ-CONSENT-REVOKE"
    ACT_REQUEST = "Δ-ACT-REQUEST"
    ACT_APPROVE = "Δ-ACT-APPROVE"
    ACT_DENY = "Δ-ACT-DENY"
    WITNESS_CLAIM = "Δ-WITNESS-CLAIM"
    WITNESS_CONSENSUS = "Δ-WITNESS-CONSENSUS"
    RISK_GATE = "Δ-RISK-GATE"
    MERKLE_ROOT = "Δ-MERKLE-ROOT"
    MERKLE_VERIFY = "Δ-MERKLE-VERIFY"
    FIELD_POINT = "Δ-FIELD-POINT"
    FIELD_GRADIENT = "Δ-FIELD-GRADIENT"
    FIELD_FLUX = "Δ-FIELD-FLUX"

class BaseReceipt(BaseModel):
    """Base Receipt Model with Lamport Clock"""
    receipt_type: ReceiptType
    lamport: int
    prev_digest: Optional[str]
    self_hash: str
    trace_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    actor_signature: Optional[str]
    band: BandLevel
    track: Track

class CRIESMetrics(BaseModel):
    """CRIES Metrics Model"""
    clarity: float = Field(ge=0, le=1)
    reliability: float = Field(ge=0, le=1)
    integrity: float = Field(ge=0, le=1)
    efficiency: float = Field(ge=0, le=1)
    safety: float = Field(ge=0, le=1)

class StabilityMetrics(BaseModel):
    """Tri-Actor Stability Metrics"""
    sigma_t: float  # Current stability
    omega_t: float  # System state
    eta: float  # Learning rate
    gamma_b: float  # Governance dampening
    weights: Dict[Track, float]  # Track weights (must sum to 1)