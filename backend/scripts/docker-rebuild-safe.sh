#!/usr/bin/env bash
set -euo pipefail

mode="dev"
retries=2

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    --retries)
      retries="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: ./scripts/docker-rebuild-safe.sh [--mode dev|prod] [--retries 2]" >&2
      exit 1
      ;;
  esac
done

if [[ "$mode" != "dev" && "$mode" != "prod" ]]; then
  echo "Invalid mode: $mode. Use dev or prod." >&2
  exit 1
fi

if ! [[ "$retries" =~ ^[0-9]+$ ]] || [[ "$retries" -lt 1 ]]; then
  echo "Invalid retries value: $retries. Use a positive number." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
cd "$project_root"

compose_file="docker-compose.dev.yml"
if [[ "$mode" == "prod" ]]; then
  compose_file="docker-compose.prod.yml"
fi

for attempt in $(seq 1 "$retries"); do
  echo "Rebuild attempt $attempt/$retries..."
  if docker compose -f "$compose_file" up -d --build --remove-orphans; then
    echo "Rebuild completed."
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    exit 0
  fi

  echo "Build failed on attempt $attempt." >&2
  sleep 3
done

echo "Failed to rebuild stack after $retries attempts." >&2
exit 1
