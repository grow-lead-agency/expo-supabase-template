#!/usr/bin/env bash
# Post-fork sanity check — catches the "cloned but never ran setup.sh" state
# and missing local config before you burn time on a broken dev server.
# Usage: bin/doctor.sh  (or: bun run doctor)

set -uo pipefail
cd "$(dirname "$0")/.."

FAIL=0
warn() { echo "⚠️  $1"; }
fail() { echo "❌ $1"; FAIL=1; }
ok()   { echo "✅ $1"; }

# 1. Placeholders replaced?
if grep -q "{{APP_SLUG}}" app.json 2>/dev/null; then
  fail "app.json still contains {{PLACEHOLDERS}} — run bin/setup.sh first"
else
  ok "app.json placeholders replaced"
fi
if grep -q "{{CLIENT}}" .maestro/smoke.yaml 2>/dev/null; then
  warn ".maestro/smoke.yaml still has {{CLIENT}} placeholder (setup.sh replaces it)"
fi

# 2. Env file
if [ ! -f .env.local ]; then
  fail ".env.local missing — cp .env.local.example .env.local and fill in"
else
  for VAR in EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY; do
    if grep -qE "^${VAR}=(your-|https://your-|$)" .env.local; then
      fail ".env.local: $VAR not filled in"
    fi
  done
  ok ".env.local exists"
fi

# 3. Dependencies
if [ ! -d node_modules ]; then
  fail "node_modules missing — run: bun install"
else
  ok "dependencies installed"
fi

# 4. Git hooks
if [ ! -f .git/hooks/pre-commit ]; then
  warn "lefthook hooks not installed — run: bunx lefthook install"
else
  ok "git hooks installed"
fi

# 5. Optional tooling
command -v eas >/dev/null 2>&1 && ok "eas-cli available" || warn "eas-cli not installed (bun add -g eas-cli) — needed for builds"
command -v maestro >/dev/null 2>&1 && ok "maestro available" || warn "maestro not installed — needed for bun run test:e2e"
command -v gitleaks >/dev/null 2>&1 && ok "gitleaks available" || warn "gitleaks not installed (brew install gitleaks) — local secret scan skipped"

# 6. OTA config (post eas init)
if command -v python3 >/dev/null 2>&1; then
  if python3 -c "import json,sys; sys.exit(0 if json.load(open('app.json'))['expo'].get('updates',{}).get('url') else 1)" 2>/dev/null; then
    ok "expo-updates URL configured"
  else
    warn "expo-updates URL not set — run: eas update:configure (after eas init)"
  fi
fi

echo ""
[ "$FAIL" -eq 0 ] && echo "🩺 Doctor: OK" || { echo "🩺 Doctor: FIX THE ❌ ITEMS ABOVE"; exit 1; }
