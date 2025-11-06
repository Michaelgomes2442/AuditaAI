#!/bin/bash

# Full Governance Optimization Test Runner (WITH API KEYS)
# This script runs the complete test suite with real API calls
# Features automatic checkpointing and graceful failure handling

set -e

cd "$(dirname "$0")"

# Load environment variables if .env file exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
fi

# Also try parent directory .env
if [ -f ../.env ]; then
    echo "Loading environment variables from ../.env file..."
    export $(grep -v '^#' ../.env | xargs)
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  GOVERNANCE OPTIMIZER V2 — FULL SUITE WITH REAL API CALLS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on http://localhost:3001"
    echo ""
    echo "Please start the backend first:"
    echo "  cd /home/michaelgomes/AuditaAI/backend"
    echo "  npm start"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Check for API keys
echo "🔍 Checking for API keys..."
chmod +x check-api-keys.sh
if ! ./check-api-keys.sh; then
    echo ""
    read -p "Continue anyway with simulation mode? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST CONFIGURATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Governance Variations: 7"
echo "  • v2-baseline (proven +8.9% Omega)"
echo "  • v2.1-cumulative"
echo "  • v2.2-depth"
echo "  • v2.3-examples"
echo "  • v2.4-rigor"
echo "  • v2.5-balanced"
echo "  • v2.6-minimal"
echo ""
echo "Test Prompts: 4 per variation"
echo "Trials per Prompt: 3 (for volatility analysis)"
echo "Total API Calls: ~84"
echo ""
echo "Estimated Time: 3-6 hours"
echo "Estimated Cost: $5-15 (Claude Opus 4)"
echo ""
echo "✅ Checkpointing: Enabled (saves after each variation)"
echo "✅ Graceful Failure: Enabled (saves partial results on crash)"
echo "✅ Credit Exhaustion Detection: Enabled"
echo "✅ Timeout Handling: 10 minutes per API call"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

read -p "Start full test suite? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Test cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting full governance optimization test suite..."
echo "   You can safely close this terminal - results will be saved automatically"
echo "   Check backend/governance-optimization-*.json for checkpoints"
echo ""
echo "Starting in 3 seconds..."
sleep 1
echo "2..."
sleep 1
echo "1..."
sleep 1
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Run the full test suite (not the Quick Validation)
npx playwright test tests/governance-optimizer-v2.test.js \
  --grep "Governance Optimization Suite V2" \
  --reporter=line \
  --workers=1 \
  --timeout=7200000

EXIT_CODE=$?

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All tests completed successfully!"
    echo ""
    echo "📊 Reports generated:"
    echo "   • governance-optimization-report-v2.json (raw data)"
    echo "   • GOVERNANCE_OPTIMIZATION_REPORT_V2.md (formatted report)"
else
    echo "⚠️  Tests exited with code $EXIT_CODE"
    echo ""
    echo "Check for partial results:"
    echo "   • governance-optimization-checkpoint-*.json"
    echo "   • GOVERNANCE_OPTIMIZATION_REPORT_V2_PARTIAL.md"
fi

echo ""
echo "All results saved in: /home/michaelgomes/AuditaAI/backend/"
echo ""

exit $EXIT_CODE
