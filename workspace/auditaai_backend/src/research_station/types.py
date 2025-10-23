"""
Research Station Core Types
Version: Band-1.3 (vΩ.9)
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class StationType(str, Enum):
    """Research Station Tiers"""
    BASIC = "basic"          # $499/mo
    PROFESSIONAL = "pro"     # $1499/mo
    ENTERPRISE = "enterprise"  # $4999/mo


class StationLimits(BaseModel):
    """Tier-specific station limits"""
    audit_limit: int
    analyst_limit: int
    has_advanced_cries: bool = False
    has_custom_policies: bool = False
    has_predictive_analytics: bool = False

    @classmethod
    def get_limits(cls, tier: StationType) -> "StationLimits":
        """Get limits for a specific tier"""
        limits_map = {
            StationType.BASIC: cls(
                audit_limit=1000,
                analyst_limit=2,
                has_advanced_cries=False,
                has_custom_policies=False,
                has_predictive_analytics=False
            ),
            StationType.PROFESSIONAL: cls(
                audit_limit=10000,
                analyst_limit=10,
                has_advanced_cries=True,
                has_custom_policies=True,
                has_predictive_analytics=False
            ),
            StationType.ENTERPRISE: cls(
                audit_limit=999999,  # Unlimited
                analyst_limit=20,
                has_advanced_cries=True,
                has_custom_policies=True,
                has_predictive_analytics=True
            )
        }
        return limits_map[tier]


class AnalystRole(str, Enum):
    """Analyst roles within a research station"""
    ADMIN = "admin"
    ANALYST = "analyst"
    VIEWER = "viewer"


class Analyst(BaseModel):
    """Research station analyst"""
    id: Optional[str] = None
    name: str
    email: str
    role: AnalystRole
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ModelType(BaseModel):
    """AI model type configuration"""
    id: Optional[str] = None
    name: str
    version: str
    type: str  # e.g., GPT-4, Claude, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PolicyRule(BaseModel):
    """Policy rule definition"""
    field: str  # The field this rule applies to
    operator: str  # e.g., gt, lt, eq, contains
    value: str  # The value to compare against
    action: str  # The action to take if rule matches
    priority: int = 0  # Rule priority (higher = more important)


class Policy(BaseModel):
    """Governance policy"""
    id: Optional[str] = None
    name: str
    description: str
    rules: List[PolicyRule]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True


class ResearchStation(BaseModel):
    """Research Station Configuration"""
    id: Optional[str] = None
    name: str
    tier: StationType
    limits: StationLimits
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relations
    analysts: List[Analyst] = []
    models: List[ModelType] = []
    policies: List[Policy] = []

    class Config:
        arbitrary_types_allowed = True

    @property
    def is_at_analyst_limit(self) -> bool:
        """Check if station is at analyst limit"""
        return len(self.analysts) >= self.limits.analyst_limit

    @property
    def remaining_daily_audits(self) -> int:
        """Get remaining daily audit quota"""
        # TODO: Implement audit counting logic
        return self.limits.audit_limit

    def can_add_analyst(self) -> bool:
        """Check if an analyst can be added"""
        return not self.is_at_analyst_limit

    def validate_tier_features(self) -> List[str]:
        """Validate features against tier limits"""
        violations = []
        limits = self.limits

        if not limits.has_advanced_cries and any(p.rules for p in self.policies):
            violations.append("Advanced CRIES metrics not available in this tier")
            
        if not limits.has_custom_policies and len(self.policies) > 0:
            violations.append("Custom policies not available in this tier")
            
        if not limits.has_predictive_analytics:
            # Check for any predictive analytics usage
            pass

        return violations