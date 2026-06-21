#!/usr/bin/env bash
set -euo pipefail

read_env_value() {
  local env_file="$1"
  local env_key="$2"

  if [[ ! -f "$env_file" ]]; then
    return 1
  fi

  awk -F= -v key="$env_key" '
    $0 ~ "^[[:space:]]*#" { next }
    $1 == key {
      value = substr($0, length($1) + 2)
      gsub(/^["'\'']|["'\'']$/, "", value)
      print value
      exit
    }
  ' "$env_file"
}

database_url_from_file() {
  local env_file="$1"
  local value=""
  local key

  for key in DATABASE_URL SUPABASE_DB_URL POSTGRES_URL POSTGRES_DATABASE_URL DIRECT_URL; do
    value="$(read_env_value "$env_file" "$key" || true)"
    if [[ -n "$value" ]]; then
      printf '%s' "$value"
      return 0
    fi
  done

  return 1
}

if [[ -z "${DEV_DATABASE_URL:-}" && -n "${DEV_ENV_FILE:-}" ]]; then
  DEV_DATABASE_URL="$(database_url_from_file "$DEV_ENV_FILE" || true)"
fi

if [[ -z "${PROD_DATABASE_URL:-}" && -n "${PROD_ENV_FILE:-}" ]]; then
  PROD_DATABASE_URL="$(database_url_from_file "$PROD_ENV_FILE" || true)"
fi

if [[ -z "${DEV_DATABASE_URL:-}" || -z "${PROD_DATABASE_URL:-}" ]]; then
  cat <<'USAGE' >&2
Usage:
  DEV_DATABASE_URL='postgresql://...' PROD_DATABASE_URL='postgresql://...' bash scripts/schema-diff.sh

  # Or, if your env files contain a direct DB URL such as DATABASE_URL:
  DEV_ENV_FILE=api/.env.dev PROD_ENV_FILE=api/.env.prod bash scripts/schema-diff.sh

Both URLs must be direct Postgres connection strings. Do not paste them into chat
or commit them to the repo. Supabase API settings like SUPABASE_URL,
SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are not enough for pg_dump.
USAGE
  exit 2
fi

PG_DUMP_BIN="${PG_DUMP:-}"
if [[ -z "$PG_DUMP_BIN" ]]; then
  PG_DUMP_BIN="$(command -v pg_dump || true)"
fi

if [[ -z "$PG_DUMP_BIN" ]]; then
  echo "pg_dump was not found. Install PostgreSQL client tools or set PG_DUMP=/path/to/pg_dump." >&2
  exit 2
fi

out_dir="${SCHEMA_DIFF_DIR:-/tmp/tma-schema-diff}"
mkdir -p "$out_dir"

dev_schema="$out_dir/dev-public-schema.sql"
prod_schema="$out_dir/prod-public-schema.sql"
diff_file="$out_dir/prod-vs-dev.diff"

dump_schema() {
  local database_url="$1"
  local output_file="$2"
  local error_file

  error_file="$(mktemp "$out_dir/pg-dump-error.XXXXXX")"

  if ! "$PG_DUMP_BIN" "$database_url" \
    --schema-only \
    --schema=public \
    --no-owner \
    --no-privileges \
    --no-comments \
    --file="$output_file" 2> "$error_file"; then
    cat "$error_file" >&2

    if grep -q "server version: .*pg_dump version:" "$error_file"; then
      cat <<'VERSION_HELP' >&2

pg_dump version mismatch detected. Supabase is running a newer Postgres server
than your local pg_dump client. Install a matching major version of PostgreSQL
client tools, then rerun with:

  PG_DUMP=/path/to/postgresql-17/bin/pg_dump bash scripts/schema-diff.sh

On macOS with Homebrew, this is usually:

  brew install postgresql@17
  PG_DUMP=/opt/homebrew/opt/postgresql@17/bin/pg_dump bash scripts/schema-diff.sh
VERSION_HELP
    fi

    rm -f "$error_file"
    return 1
  fi

  rm -f "$error_file"
}

echo "Dumping dev public schema..."
dump_schema "$DEV_DATABASE_URL" "$dev_schema"

echo "Dumping prod public schema..."
dump_schema "$PROD_DATABASE_URL" "$prod_schema"

set +e
diff -u "$prod_schema" "$dev_schema" > "$diff_file"
diff_status=$?
set -e

echo "Dev schema:  $dev_schema"
echo "Prod schema: $prod_schema"
echo "Diff file:   $diff_file"

if [[ "$diff_status" -eq 0 ]]; then
  echo "No public schema differences found."
elif [[ "$diff_status" -eq 1 ]]; then
  echo "Schema differences found. Review $diff_file."
else
  echo "diff failed with status $diff_status." >&2
  exit "$diff_status"
fi
