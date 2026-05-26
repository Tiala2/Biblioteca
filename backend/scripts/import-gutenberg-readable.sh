#!/usr/bin/env bash
set -euo pipefail

api_url="${API_URL:-http://localhost:8080}"
email="${ADMIN_EMAIL:-}"
password="${ADMIN_PASSWORD:-}"
query="fiction"
pages=10
target_count=10

usage() {
  cat <<'EOF'
Usage: ./scripts/import-gutenberg-readable.sh [options]

Options:
  --api-url URL        API base URL. Default: http://localhost:8080
  --email EMAIL        Admin email. Can also use ADMIN_EMAIL.
  --password PASSWORD  Admin password. Can also use ADMIN_PASSWORD.
  --query QUERY        Gutendex/Gutenberg search. Default: fiction
  --pages NUMBER       Gutendex pages to scan. Default: 10
  --target-count NUM   Target imported books. Default: 10
  -h, --help           Show this help.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-url)
      api_url="${2:-}"
      shift 2
      ;;
    --email)
      email="${2:-}"
      shift 2
      ;;
    --password)
      password="${2:-}"
      shift 2
      ;;
    --query)
      query="${2:-}"
      shift 2
      ;;
    --pages)
      pages="${2:-}"
      shift 2
      ;;
    --target-count)
      target_count="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to safely build and parse JSON." >&2
  exit 1
fi

if [[ -z "$email" ]]; then
  read -r -p "Admin email: " email
fi

if [[ -z "$password" ]]; then
  read -r -s -p "Admin password: " password
  echo
fi

api_url="${api_url%/}"

echo "== Project Gutenberg internal reader import =="
echo "API: $api_url"
echo "Query: $query"
echo "Target: $target_count book(s) with internal reading"

login_body="$(
  EMAIL="$email" PASSWORD="$password" python3 - <<'PY'
import json
import os

print(json.dumps({
    "email": os.environ["EMAIL"],
    "password": os.environ["PASSWORD"],
}))
PY
)"

login_response="$(
  curl -fsS \
    -H "Content-Type: application/json" \
    -X POST \
    -d "$login_body" \
    "$api_url/api/v1/auth/login"
)"

token="$(
  python3 -c '
import json
import sys

payload = json.load(sys.stdin)
token = payload.get("token")
if not token:
    raise SystemExit("Login response did not include a token.")
print(token)
' <<< "$login_response"
)"

import_body="$(
  QUERY="$query" PAGES="$pages" TARGET_COUNT="$target_count" python3 - <<'PY'
import json
import os

print(json.dumps({
    "query": os.environ["QUERY"],
    "pages": int(os.environ["PAGES"]),
    "pageSize": 100,
    "readableOnly": True,
    "targetImportCount": int(os.environ["TARGET_COUNT"]),
}))
PY
)"

import_response="$(
  curl -fsS \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -X POST \
    -d "$import_body" \
    "$api_url/api/admin/books/import/gutenberg"
)"

python3 -c '
import json
import sys

payload = json.load(sys.stdin)
print()
print("Import finished.")
print(f"Fetched:  {payload.get('fetched', 0)}")
print(f"Imported: {payload.get('imported', 0)}")
print(f"Skipped:  {payload.get('skipped', 0)}")
print(f"Failed:   {payload.get('failed', 0)}")

messages = payload.get("messages") or []
if messages:
    print()
    print("Messages:")
    for message in messages:
        print(f"- {message}")
' <<< "$import_response"
