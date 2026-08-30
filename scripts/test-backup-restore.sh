#!/usr/bin/env sh
set -eu

# This wrapper cannot drop production: the Node verifier requires a separately
# named test database and an exact RESTORE_CONFIRM_DATABASE match.
exec node "$(dirname "$0")/database-restore-test.mjs" "${1:-}"
