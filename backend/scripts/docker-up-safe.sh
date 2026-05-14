#!/usr/bin/env bash
set -euo pipefail

mode="dev"
build=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --build)
      build=1
      shift
      ;;
    --mode)
      mode="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: ./scripts/docker-up-safe.sh [--build] [--mode dev|prod]" >&2
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

api_port="${API_PORT:-8080}"
export API_PORT="$api_port"
export API_PUBLIC_BASE_URL="${API_PUBLIC_BASE_URL:-http://localhost:$api_port}"
required_ports=("$api_port" 5437 9000 9001)
if [[ "$mode" == "dev" ]]; then
  required_ports+=(1025 8025)
fi

own_published_ports=()
while IFS= read -r published_port; do
  [[ -n "$published_port" ]] && own_published_ports+=("$published_port")
done < <(
  docker compose -f "$compose_file" ps --format json 2>/dev/null \
    | tr ',' '\n' \
    | sed -n 's/.*"PublishedPort":[[:space:]]*\([0-9][0-9]*\).*/\1/p' \
    || true
)

busy_ports=()

for port in "${required_ports[@]}"; do
  if printf '%s\n' "${own_published_ports[@]}" | grep -qx "$port"; then
    continue
  fi

  if command -v ss >/dev/null 2>&1; then
    line="$(ss -ltnp "sport = :$port" 2>/dev/null | awk 'NR==2 {print}')"
  elif command -v lsof >/dev/null 2>&1; then
    line="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print}')"
  else
    echo "Install iproute2/ss or lsof to check busy ports automatically." >&2
    line=""
  fi

  if [[ -n "$line" ]]; then
    busy_ports+=("$port|$line")
  fi
done

if [[ "${#busy_ports[@]}" -gt 0 ]]; then
  echo "The backend stack cannot start because one or more required ports are already in use." >&2
  printf '\n%-8s %s\n' "PORT" "LISTENER"
  for item in "${busy_ports[@]}"; do
    printf '%-8s %s\n' "${item%%|*}" "${item#*|}"
  done
  echo
  echo "Close the listed process or stop the container using it, then run this script again."
  echo "Docker containers currently running:"
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
  exit 1
fi

required_volumes=(
  "library-api-projeto_library-data"
  "library-api-projeto_minio-data"
)

for volume in "${required_volumes[@]}"; do
  if ! docker volume inspect "$volume" >/dev/null 2>&1; then
    echo "Creating missing volume: $volume"
    docker volume create "$volume" >/dev/null
  fi
done

args=(compose -f "$compose_file" up -d --remove-orphans)
if [[ "$build" -eq 1 ]]; then
  args+=(--build)
fi

echo "Starting stack..."
docker "${args[@]}"

echo
echo "Current containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "Tip: wait until API is healthy in logs before testing:"
echo "docker logs -f backend-api-1"
