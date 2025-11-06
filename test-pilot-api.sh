#!/bin/bash
# Pilot Dashboard API Test Suite
# Tests all 6 new endpoints

BACKEND_URL="http://localhost:3001"
SESSION_ID="test-session-$(date +%s)"
RUN_ID="test-run-$(date +%s)"

echo "🧪 Pilot Dashboard API Test Suite"
echo "=================================="
echo ""
echo "Session ID: $SESSION_ID"
echo "Run ID: $RUN_ID"
echo ""

# Test 1: Run Prompt
echo "📝 Test 1: POST /api/pilot/run-prompt"
echo "--------------------------------------"
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/pilot/run-prompt" \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"What is data governance?\",
    \"model\": \"gpt-4\",
    \"useGovernance\": true,
    \"sessionId\": \"$SESSION_ID\",
    \"runId\": \"$RUN_ID\"
  }")

echo "$RESPONSE" | jq '.success, .receipts | length, .executionTime' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Get Receipts
echo "📋 Test 2: GET /api/pilot/receipts"
echo "-----------------------------------"
curl -s "$BACKEND_URL/api/pilot/receipts?sessionId=$SESSION_ID&limit=5" | jq '.count, .receipts[0].type' 2>/dev/null || echo "No receipts yet"
echo ""

# Test 3: Verify Single Receipt
echo "🔍 Test 3: POST /api/pilot/verify-receipt"
echo "------------------------------------------"
RECEIPT_ID=$(echo "$RESPONSE" | jq -r '.receipts[0].id' 2>/dev/null)
if [ "$RECEIPT_ID" != "null" ] && [ -n "$RECEIPT_ID" ]; then
  curl -s -X POST "$BACKEND_URL/api/pilot/verify-receipt" \
    -H "Content-Type: application/json" \
    -d "{\"receiptId\": $RECEIPT_ID}" | jq '.valid, .checks' 2>/dev/null
else
  echo "No receipt ID available"
fi
echo ""

# Test 4: Verify Chain
echo "🔗 Test 4: POST /api/pilot/verify-chain"
echo "---------------------------------------"
curl -s -X POST "$BACKEND_URL/api/pilot/verify-chain" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}" | jq '.valid, .totalReceipts, .chainIntact' 2>/dev/null
echo ""

# Test 5: Export Receipts
echo "💾 Test 5: GET /api/pilot/export-receipts"
echo "-----------------------------------------"
EXPORT_FILE="pilot-export-test-$(date +%s).json"
curl -s "$BACKEND_URL/api/pilot/export-receipts?sessionId=$SESSION_ID" -o "$EXPORT_FILE"
if [ -f "$EXPORT_FILE" ]; then
  FILE_SIZE=$(wc -c < "$EXPORT_FILE")
  RECEIPT_COUNT=$(jq '.receipts | length' "$EXPORT_FILE" 2>/dev/null)
  echo "✅ Export successful: $FILE_SIZE bytes, $RECEIPT_COUNT receipts"
  echo "   File: $EXPORT_FILE"
  rm -f "$EXPORT_FILE"
else
  echo "❌ Export failed"
fi
echo ""

# Test 6: Re-run
echo "🔁 Test 6: POST /api/pilot/rerun"
echo "--------------------------------"
if [ "$RUN_ID" != "null" ] && [ -n "$RUN_ID" ]; then
  curl -s -X POST "$BACKEND_URL/api/pilot/rerun" \
    -H "Content-Type: application/json" \
    -d "{
      \"originalRunId\": \"$RUN_ID\",
      \"prompt\": \"What is data governance?\",
      \"model\": \"gpt-4\",
      \"useGovernance\": true
    }" | jq '.success, .comparison.cries.delta' 2>/dev/null
else
  echo "No run ID available for rerun"
fi
echo ""

echo "=================================="
echo "✅ All tests complete!"
echo ""
echo "To test manually:"
echo "  curl -X POST $BACKEND_URL/api/pilot/run-prompt -H 'Content-Type: application/json' -d '{\"prompt\":\"test\",\"model\":\"gpt-4\",\"sessionId\":\"$SESSION_ID\"}'"
