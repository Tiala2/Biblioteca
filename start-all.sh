#!/usr/bin/env bash
set -euo pipefail

mode="dev"
build_backend=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build-backend)
      build_backend=1
      shift
      ;;
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: ./start-all.sh [--build-backend] [--mode dev|prod]" >&2
      exit 1
      ;;
  esac
done

if [[ "$mode" != "dev" && "$mode" != "prod" ]]; then
  echo "Invalid mode: $mode. Use dev or prod." >&2
  exit 1
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting backend stack ($mode)..."
backend_args=(--mode "$mode")
if [[ "$build_backend" -eq 1 ]]; then
  backend_args+=(--build)
fi

bash "$root/backend/scripts/docker-up-safe.sh" "${backend_args[@]}"

echo
echo "Starting frontend dev server..."
bash "$root/frontend/scripts/front-dev-safe.sh"
