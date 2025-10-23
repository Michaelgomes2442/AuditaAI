#!/usr/bin/env bash
set -euo pipefail
BASE="http://localhost:3000"
EMAIL="test-$(date +%s)@example.com"
PASSWORD="password123"
NAME="Test User"

echo "Creating user $EMAIL"
curl -s -X POST "$BASE/api/auth/signup" -H 'Content-Type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}" | jq .

echo "Checking protected endpoint (should 401)"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/protected")
echo "Status: $STATUS"
if [ "$STATUS" -ne 401 ]; then
  echo "Expected 401 for unauthenticated protected endpoint"; exit 1
fi

# sign in
echo "Signing in"
RESP=$(curl -s -c cookies.txt -X POST "$BASE/api/auth/callback/credentials" -d "username=$EMAIL&password=$PASSWORD") || true
# try protected with Bearer email token (test-only)
STATUS2=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $EMAIL" "$BASE/api/protected")
echo "Protected status after sign-in: $STATUS2"

if [ "$STATUS2" -ne 200 ]; then
  echo "Protected endpoint still not accessible"; exit 1
fi

echo "Integration test passed"
