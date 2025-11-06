"""
Path Resolution Utility for BEN Governance
Provides portable path resolution across different deployment environments.
"""

import os
from pathlib import Path


def get_project_root() -> Path:
    """
    Derive project root from script location or AUDITAAI_HOME environment variable.
    
    Priority:
    1. AUDITAAI_HOME environment variable
    2. Walk up from script location to find project marker files
    3. Default to ~/AuditaAI as fallback
    
    Returns:
        Path: Project root directory
    """
    # Priority 1: Check environment variable
    if env_root := os.getenv("AUDITAAI_HOME"):
        root = Path(env_root).resolve()
        if root.exists():
            return root
    
    # Priority 2: Walk up from script location
    current = Path(__file__).resolve().parent
    
    # Look for project markers (receipts dir, backend dir, etc.)
    for _ in range(5):  # Max 5 levels up
        if (current / "receipts").exists() or (current / "backend").exists():
            return current
        if current.parent == current:  # Reached filesystem root
            break
        current = current.parent
    
    # Priority 3: Fallback to ~/AuditaAI
    fallback = Path.home() / "AuditaAI"
    if fallback.exists():
        return fallback
    
    # If nothing works, use current working directory
    return Path.cwd()


def get_receipts_dir() -> Path:
    """Get the receipts directory path"""
    return get_project_root() / "receipts"


def get_key_path() -> Path:
    """Get the BEN encryption key path"""
    return get_project_root() / "ben_governance" / "ben.key"


def get_state_path() -> Path:
    """Get the state.json path"""
    return get_receipts_dir() / "state.json"


def get_registry_path() -> Path:
    """Get the registry.json path"""
    return get_receipts_dir() / "registry.json"


# Convenience exports
PROJECT_ROOT = get_project_root()
RECEIPTS_DIR = get_receipts_dir()
KEY_PATH = get_key_path()
STATE_PATH = get_state_path()
REGISTRY_PATH = get_registry_path()
