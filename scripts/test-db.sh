#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
VENU_QA_DIR=$(mktemp -d "${TMPDIR:-/tmp}/venu-db-qa.XXXXXX")
VENU_QA_PORT=${VENU_TEST_PORT:-55438}
cleanup() {
  pg_ctl -D "$VENU_QA_DIR/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$VENU_QA_DIR"
}
trap cleanup EXIT
initdb -D "$VENU_QA_DIR/data" -A trust --no-locale -E UTF8 >/dev/null
pg_ctl -D "$VENU_QA_DIR/data" -l "$VENU_QA_DIR/server.log" -o "-h 127.0.0.1 -p $VENU_QA_PORT" start >/dev/null
PSQL=(psql -X -h 127.0.0.1 -p "$VENU_QA_PORT" -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" <<'SQL'
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
SQL
for migration in supabase/migrations/*.sql; do "${PSQL[@]}" -f "$migration"; done
VENU_TEST_HOST=127.0.0.1 VENU_TEST_PORT="$VENU_QA_PORT" python3 scripts/check-booking-integrity.py
