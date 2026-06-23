#!/usr/bin/env bash
set -euo pipefail

output_dir="backups"
database_container="backend-library-1"
minio_volume="library-api-projeto_minio-data"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir)
      output_dir="${2:-}"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./scripts/backup-volumes.sh [--output-dir <path>]" >&2
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: ./scripts/backup-volumes.sh [--output-dir <path>]" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$output_dir" ]]; then
  echo "Missing --output-dir value." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
cd "$project_root"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker was not found in PATH." >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx "$database_container"; then
  echo "Container $database_container is not running." >&2
  exit 1
fi

if ! docker volume inspect "$minio_volume" >/dev/null 2>&1; then
  echo "Volume $minio_volume was not found." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$output_dir"
backup_root="$(cd "$output_dir" && pwd)"
target="$backup_root/$timestamp"
mkdir -p "$target"

echo "Backup folder: $target"

db_file="$target/postgres-library.sql"
echo "Backing up PostgreSQL..."
docker exec "$database_container" sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$db_file"

echo "Backing up MinIO volume..."
docker run --rm \
  -v "$minio_volume:/data" \
  -v "$target:/backup" \
  alpine sh -c "tar -czf /backup/minio-data.tar.gz -C /data ."

minio_file="$target/minio-data.tar.gz"

for file in "$db_file" "$minio_file"; do
  if [[ ! -s "$file" ]]; then
    echo "Backup file is missing or empty: $file" >&2
    exit 1
  fi
done

if ! grep -q "PostgreSQL database dump" "$db_file"; then
  echo "PostgreSQL dump does not contain the expected header." >&2
  exit 1
fi

(
  cd "$target"
  sha256sum postgres-library.sql minio-data.tar.gz > checksums.sha256
)

cat > "$target/backup-metadata.txt" <<EOF
created_at=$(date --iso-8601=seconds)
database_container=$database_container
minio_volume=$minio_volume
database_size_bytes=$(stat -c%s "$db_file")
minio_size_bytes=$(stat -c%s "$minio_file")
EOF

echo "Backup completed:"
echo "- $db_file"
echo "- $minio_file"
echo "- $target/checksums.sha256"
echo "- $target/backup-metadata.txt"
