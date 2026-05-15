#!/usr/bin/env bash
set -euo pipefail

backup_dir=""
force=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup-dir)
      backup_dir="${2:-}"
      shift 2
      ;;
    --force)
      force=1
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: ./scripts/restore-volumes.sh --backup-dir <path> --force" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$backup_dir" ]]; then
  echo "Missing --backup-dir <path>." >&2
  exit 1
fi

if [[ "$force" -ne 1 ]]; then
  echo "Use --force to confirm restore. This replaces the current database schema and MinIO files." >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
cd "$project_root"

resolved_backup_dir="$(cd "$backup_dir" && pwd)"
db_file="$resolved_backup_dir/postgres-library.sql"
minio_archive="$resolved_backup_dir/minio-data.tar.gz"

if [[ ! -f "$db_file" ]]; then
  echo "File not found: $db_file" >&2
  exit 1
fi

if [[ ! -f "$minio_archive" ]]; then
  echo "File not found: $minio_archive" >&2
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -qx 'backend-library-1'; then
  echo "Container backend-library-1 is not running. Start the backend stack before restoring." >&2
  exit 1
fi

echo "Restoring PostgreSQL from $db_file"
docker exec backend-library-1 sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"'
docker exec -i backend-library-1 sh -lc 'psql -U "$POSTGRES_USER" "$POSTGRES_DB" -v ON_ERROR_STOP=1' < "$db_file"

echo "Restoring MinIO volume from $minio_archive"
docker run --rm \
  -v library-api-projeto_minio-data:/data \
  -v "$resolved_backup_dir:/backup" \
  alpine sh -c "rm -rf /data/* && tar -xzf /backup/minio-data.tar.gz -C /data"

echo "Restore completed successfully."
