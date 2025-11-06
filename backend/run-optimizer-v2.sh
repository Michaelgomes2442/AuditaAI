#!/bin/bash

# Governance Optimizer V2 Test Runner
# Research-grade A/B testing with volatility analysis

set -e

cd "$(dirname "$0")"

echo "═══════════════════════════════════════════════════════════════"
echo "  GOVERNANCE OPTIMIZER V2 — Research-Grade Testing"
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
if [ -z "$ANTHROPIC_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  WARNING: No API keys found in environment"
    echo "   Tests will use simulation mode (not real LLM calls)"
    echo ""
    echo "   To use real API calls, set environment variables:"
    echo "     export ANTHROPIC_API_KEY='your-key-here'"
    echo "     export OPENAI_API_KEY='your-key-here'"
    echo ""
    read -p "Continue with simulation mode? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    if [ ! -z "$ANTHROPIC_API_KEY" ]; then
        echo "✅ Anthropic API key found"
    fi
    if [ ! -z "$OPENAI_API_KEY" ]; then
        echo "✅ OpenAI API key found"
    fi
fi
echo ""

# Ask which test to run
echo "Select test mode:"
echo "  1) Full optimization suite (3-6 hours, 7 variations)"
echo "  2) Quick validation (10-15 min, 1 prompt × 3 trials)"
echo "  3) Single variation test (custom)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "  FULL OPTIMIZATION SUITE"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "This will test 7 governance variations with:"
        echo "  • 4 diverse test prompts per variation"
        echo "  • 3 trials per prompt (volatility analysis)"
        echo "  • Statistical metrics (mean, stddev, CI)"
        echo "  • Cost efficiency tracking (Ω/$1, Ω/100tok)"
        echo ""
        echo "Expected time: 3-6 hours"
        echo ""
        read -p "Continue? (y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 0
        fi
        
        echo ""
        echo "🚀 Starting full optimization suite..."
        npx playwright test tests/governance-optimizer-v2.test.js --reporter=line --workers=1
        
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "  RESULTS"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "📊 Raw data: governance-optimization-report-v2.json"
        echo "📄 Report:   GOVERNANCE_OPTIMIZATION_REPORT_V2.md"
        echo ""
        ;;
    
    2)
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "  QUICK VALIDATION"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "This will test current governance with:"
        echo "  • 1 test prompt (Executive AI Risk)"
        echo "  • 3 trials for volatility analysis"
        echo "  • Statistical summary"
        echo ""
        echo "Expected time: 10-15 minutes"
        echo ""
        
        echo "🚀 Starting quick validation..."
        npx playwright test tests/governance-optimizer-v2.test.js --grep "Quick Validation" --reporter=line
        ;;
    
    3)
        echo ""
        echo "═══════════════════════════════════════════════════════════════"
        echo "  SINGLE VARIATION TEST"
        echo "═══════════════════════════════════════════════════════════════"
        echo ""
        echo "Available variations:"
        echo "  1) v2-baseline          - Pure reasoning-first"
        echo "  2) v2.1-cumulative      - Cumulative reasoning"
        echo "  3) v2.2-depth           - Stronger depth"
        echo "  4) v2.3-examples        - Enhanced examples"
        echo "  5) v2.4-rigor           - Explicit rigor"
        echo "  6) v2.5-balanced        - Balanced CRIES"
        echo "  7) v2.6-minimal         - Ultra-minimal"
        echo ""
        read -p "Enter variation name (e.g., v2.2-depth): " variation
        
        echo ""
        echo "🚀 Testing variation: $variation"
        npx playwright test tests/governance-optimizer-v2.test.js --grep "$variation" --reporter=line --workers=1
        ;;
    
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Testing complete!"
