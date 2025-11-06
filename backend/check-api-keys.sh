#!/bin/bash

# Check API Keys Script
# Verifies that real API keys are configured before running the full test suite

# Load environment variables if .env file exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Also try parent directory .env
if [ -f ../.env ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  API KEY VERIFICATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

KEYS_FOUND=0

if [ ! -z "$ANTHROPIC_API_KEY" ]; then
    echo "✅ ANTHROPIC_API_KEY is set"
    echo "   Length: ${#ANTHROPIC_API_KEY} characters"
    echo "   Prefix: ${ANTHROPIC_API_KEY:0:10}..."
    KEYS_FOUND=1
else
    echo "❌ ANTHROPIC_API_KEY is NOT set"
fi

echo ""

if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "✅ OPENAI_API_KEY is set"
    echo "   Length: ${#OPENAI_API_KEY} characters"
    echo "   Prefix: ${OPENAI_API_KEY:0:10}..."
    KEYS_FOUND=1
else
    echo "❌ OPENAI_API_KEY is NOT set"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"

if [ $KEYS_FOUND -eq 0 ]; then
    echo "❌ NO API KEYS FOUND"
    echo ""
    echo "Tests will run in SIMULATION MODE (not real API calls)"
    echo ""
    echo "To use real API keys, export them in your environment:"
    echo "  export ANTHROPIC_API_KEY='sk-ant-...'"
    echo "  export OPENAI_API_KEY='sk-...'"
    echo ""
    exit 1
else
    echo "✅ API keys configured - ready for real testing"
    echo ""
    echo "⚠️  WARNING: Full test suite will:"
    echo "   - Test 7 governance variations"
    echo "   - Run 3 trials per variation"
    echo "   - Test 4 prompts per trial"
    echo "   - Total: ~84 API calls"
    echo "   - Estimated cost: $5-15 depending on output length"
    echo "   - Estimated time: 3-6 hours"
    echo ""
    exit 0
fi
