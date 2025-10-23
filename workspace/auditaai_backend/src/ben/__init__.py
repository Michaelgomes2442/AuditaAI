"""
BEN (Blockchain Event Network) Core Package
Version: Band-1.3 (vΩ.9)
"""

from .audit_service import AuditService
from .ben_boot import BENBootSystem, RuntimeConfig
from .ben_event import BENEventProcessor
from .types import (
    BandLevel,
    Track,
    ReceiptType,
    BaseReceipt,
    CRIESMetrics,
    StabilityMetrics
)
from .verify_chain import ChainVerifier
from .verify_hash import HashVerifier
from .receipt_utils import canonicalize_receipt

__all__ = [
    'AuditService',
    'BENBootSystem',
    'BENEventProcessor',
    'RuntimeConfig',
    'BandLevel',
    'Track',
    'ReceiptType',
    'BaseReceipt',
    'CRIESMetrics',
    'StabilityMetrics',
    'ChainVerifier',
    'HashVerifier'
    ,
    'canonicalize_receipt'
]

__version__ = "1.3.0"