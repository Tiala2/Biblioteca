#!/usr/bin/env bash
set -euo pipefail

mode="dev"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: ./scripts/docker-stop-safe.sh [--mode dev|prod]" >&2
      exit 1
      ;;
  esac
done

if [[ "$mode" != "dev" && "$mode" != "prod" ]]; then
  echo "Invalid mode: $mode. Use dev or prod." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
cd "$project_root"

compose_file="docker-compose.dev.yml"
if [[ "$mode" == "prod" ]]; then
  compose_file="docker-compose.prod.yml"
fi

echo "Stopping containers without removing data..."
docker compose -f "$compose_file" stop

echo
echo "Stopped. Data remains in volumes:"
echo "- library-api-projeto_library-data"
echo "- library-api-projeto_minio-data"
