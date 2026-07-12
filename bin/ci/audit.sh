#!/usr/bin/env bash
# bun audit gate with allowlist.
#
# Why not plain `bun audit`: Expo/Sentry build tooling pins transitive deps
# (undici, uuid, js-yaml) that carry advisories but never ship in the app
# bundle. Those are vetted + listed in audit-allowlist.txt with a review date.
# Anything NOT allowlisted still fails the gate.
#
# Local inspection: `bun audit` (raw). Remediate with `bun update`, then
# remove the fixed GHSA from the allowlist.

set -uo pipefail
cd "$(dirname "$0")/../.."
ALLOWLIST="bin/ci/audit-allowlist.txt"

OUT=$(bun audit 2>&1) || true # exits 1 on any finding — we decide below
echo "$OUT"
echo ""

FOUND=$(echo "$OUT" | grep -oE 'GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}' | sort -u)
if [ -z "$FOUND" ]; then
  echo "✅ bun audit: no advisories"
  exit 0
fi

RESIDUAL=""
for id in $FOUND; do
  grep -q "^$id$" "$ALLOWLIST" || RESIDUAL="$RESIDUAL $id"
done

if [ -n "$RESIDUAL" ]; then
  echo "❌ Non-allowlisted advisories:$RESIDUAL"
  echo "   Fix via 'bun update', or vet + add to $ALLOWLIST with justification and review date."
  exit 1
fi

echo "✅ All $(echo "$FOUND" | wc -l | tr -d ' ') advisories are allowlisted (build-time tooling, vetted — see $ALLOWLIST)"
exit 0
