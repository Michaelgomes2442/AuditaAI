#!/bin/bash

echo "Governance Optimization Test Status"
echo "===================================="
echo ""

# Check if test is running
if pgrep -f "playwright.*governance-optimizer" > /dev/null; then
    echo "✓ Test is running"
    echo ""
    echo "Current test output (last 30 lines):"
    echo "------------------------------------"
    tail -30 /tmp/playwright-test.log 2>/dev/null || echo "No log file yet"
else
    echo "✗ Test is not running"
fi

echo ""
echo "Checking for results file..."
if [ -f "/home/michaelgomes/AuditaAI/backend/governance-optimization-report.json" ]; then
    echo "✓ Results file exists"
    echo ""
    echo "Summary:"
    cat /home/michaelgomes/AuditaAI/backend/governance-optimization-report.json | jq -r '.[] | "  \(.description): Ω \(.avgOmegaImprovement)%"' 2>/dev/null || echo "  (parsing error)"
else
    echo "✗ No results file yet"
fi
