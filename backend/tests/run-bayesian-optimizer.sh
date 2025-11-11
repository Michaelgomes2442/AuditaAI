#!/bin/bash
# Quick Start Script for Bayesian Optimization
# Usage: ./run-bayesian-optimizer.sh [budget] [n_initial]

set -e

BUDGET=${1:-50.0}
N_INITIAL=${2:-10}

echo "=================================================="
echo "  Bayesian Optimization for Governance Tuning"
echo "=================================================="
echo ""
echo "Budget: \$$BUDGET"
echo "Initial samples: $N_INITIAL"
echo ""

# Check if backend is running
echo "🔍 Checking backend status..."
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on http://localhost:3001"
    echo "   Please start the backend first:"
    echo "   cd /home/michaelgomes/AuditaAI/backend && npm start"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Check Python dependencies
echo "🔍 Checking Python dependencies..."
if ! python3 -c "import sklearn, scipy, numpy" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements-optimizer.txt
else
    echo "✅ Dependencies installed"
fi
echo ""

# Run optimizer
echo "🚀 Starting Bayesian Optimization..."
echo ""

python3 governance-bayesian-optimizer.py \
    --budget "$BUDGET" \
    --n-initial "$N_INITIAL" \
    --warm-start

echo ""
echo "=================================================="
echo "✅ Optimization complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Review results in governance_bo_results_*.json"
echo "2. Test best configuration with Quick Validation"
echo "3. Deploy as v3.0 governance if Ω improvement > 15%"
