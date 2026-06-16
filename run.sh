#!/usr/bin/env bash
#
# run.sh — start the Blip backend (FastAPI) and frontend (Next.js) together.
# Ctrl+C stops both. Logs from both are streamed to this terminal.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# Pick the backend Python: prefer the project virtualenv, fall back to python3.
if [ -x "$BACKEND_DIR/.venv/bin/python" ]; then
  PY="$BACKEND_DIR/.venv/bin/python"
elif [ -x "$BACKEND_DIR/venv/bin/python" ]; then
  PY="$BACKEND_DIR/venv/bin/python"
else
  PY="$(command -v python3 || command -v python)"
  echo "⚠  No backend/.venv found — using system Python: $PY"
fi

pids=()

cleanup() {
  echo ""
  echo "⏹  Stopping Blip..."
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  exit 0
}
trap cleanup INT TERM

echo "▶  Backend  →  http://localhost:$BACKEND_PORT   (FastAPI)"
( cd "$BACKEND_DIR" && exec "$PY" -m uvicorn main:app --reload --port "$BACKEND_PORT" ) &
pids+=($!)

echo "▶  Frontend →  http://localhost:$FRONTEND_PORT   (Next.js)"
( cd "$FRONTEND_DIR" && exec npm run dev -- --port "$FRONTEND_PORT" ) &
pids+=($!)

echo "✔  Both running. Press Ctrl+C to stop."

# If either process exits, tear the other one down too.
wait -n
cleanup
