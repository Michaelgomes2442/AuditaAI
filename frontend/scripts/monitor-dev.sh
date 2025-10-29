#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

# monitor-dev.sh
# Starts the Next.js dev server (pnpm dev), tails the logs to stable files,
# and prints a small live health check to stdout so an external agent can
# determine when the app is ready. Designed for local CI or agent monitoring.

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
OUT_FILE=/tmp/next-dev.out
TAIL_FILE=/tmp/next-dev-tail.out
PID_FILE=/tmp/next-dev.pid
TAIL_PID_FILE=/tmp/next-dev-tail.pid

echo "[monitor-dev] root dir: $ROOT_DIR"

cd "$ROOT_DIR"

echo "[monitor-dev] killing any existing next dev processes..."
pkill -f "next dev" || true
sleep 1

echo "[monitor-dev] starting pnpm dev (stdout+stderr -> $OUT_FILE)"
pnpm dev > "$OUT_FILE" 2>&1 &
DEV_PID=$!
echo $DEV_PID > "$PID_FILE"
echo "[monitor-dev] dev pid=$DEV_PID"

echo "[monitor-dev] tailing $OUT_FILE -> $TAIL_FILE"
tail -n +1 -f "$OUT_FILE" > "$TAIL_FILE" 2>&1 &
TAIL_PID=$!
echo $TAIL_PID > "$TAIL_PID_FILE"
echo "[monitor-dev] tail pid=$TAIL_PID"

echo "[monitor-dev] health-checking http://localhost:3000/api/auth/providers"
MAX=120
COUNT=0
while [ $COUNT -lt $MAX ]; do
  COUNT=$((COUNT+1))
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/providers | grep -qE "200|401|302"; then
    echo "[monitor-dev] server is responding (probe #$COUNT)"
    break
  fi
  echo "[monitor-dev] probe #$COUNT: not up yet"
  sleep 1
done

if [ $COUNT -ge $MAX ]; then
  echo "[monitor-dev] server did not respond after $MAX seconds; leaving processes running. See $OUT_FILE and $TAIL_FILE"
  echo "[monitor-dev] dev pid=$DEV_PID tail pid=$TAIL_PID"
  exit 2
fi

echo "[monitor-dev] server up — streaming last lines of tail file." 
echo "--- BEGIN STREAM (press Ctrl-C to stop) ---"
# Print the last 200 lines first for quick context, then follow
tail -n 200 "$TAIL_FILE" || true
# Now follow and highlight NextAuth/Next session events for convenience
# Use awk to prefix timestamps
awk 'BEGIN{ORS="\n"} { print strftime("[%Y-%m-%d %H:%M:%S]"), $0 }' <(tail -n 0 -f "$TAIL_FILE")
