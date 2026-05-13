#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
cd "$project_root"

api_url="http://localhost:8080/actuator/health"
echo "Checking API at $api_url ..."

for attempt in {1..15}; do
  if command -v curl >/dev/null 2>&1 && curl -fsS --max-time 4 "$api_url" | grep -q '"status"[[:space:]]*:[[:space:]]*"UP"'; then
    echo "API is UP. Starting frontend..."
    break
  fi

  if [[ "$attempt" -eq 15 ]]; then
    echo "Warning: API not ready yet. Frontend will start, but requests may fail for a moment." >&2
  else
    sleep 2
  fi
done

port=5173
pid=""

if command -v lsof >/dev/null 2>&1; then
  pid="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
elif command -v fuser >/dev/null 2>&1; then
  pid="$(fuser "$port/tcp" 2>/dev/null | awk '{print $1}' || true)"
fi

if [[ -n "$pid" ]]; then
  process_name="$(ps -p "$pid" -o comm= 2>/dev/null || true)"
  if [[ "$process_name" == node* ]]; then
    echo "Warning: port 5173 already in use by node (PID $pid). Closing old frontend process..."
    kill "$pid"
    sleep 1
  else
    echo "Port 5173 is busy by another app (PID $pid, process: ${process_name:-unknown}). Close it and run again." >&2
    exit 1
  fi
fi

if [[ ! -d node_modules ]]; then
  echo "Installing frontend dependencies..."
  npm ci
fi

npm run dev -- --port 5173 --strictPort
