#!/usr/bin/env sh
set -eu

# Compatibility entry point. All target, retention, integrity, and external
# storage safeguards live in database-backup.mjs.
MODE="${1:-daily}"
exec node "$(dirname "$0")/database-backup.mjs" --mode "$MODE"
