#!/bin/bash

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Loaded .env file"
else
    echo "❌ No .env file found - tests will use simulation mode"
    exit 1
fi

# Check if API keys are set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not set in .env"
    echo "   Tests will use simulation mode (not real Opus calls)"
    exit 1
fi

echo "✓ API keys configured"
echo "  Anthropic: ${ANTHROPIC_API_KEY:0:20}..."
echo ""

# Run the optimization tests with real API calls
echo "🚀 Starting governance optimization tests with REAL Opus calls..."
echo "⏱️  This will take 20-40 minutes (each test = ~5 min)"
echo ""

npx playwright test tests/governance-optimizer.test.js \
  --reporter=line \
  --workers=3 \
  --timeout=1200000

echo ""
echo "✅ Tests complete! Check governance-optimization-report.json for results"
