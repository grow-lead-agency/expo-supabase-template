#!/usr/bin/env bash
# Interactive setup for forked expo-supabase-template
# Usage:
#   bin/setup.sh                                    # interactive
#   bin/setup.sh --profile=client --bundle-id=cz.foo.app --supabase-ref=abc123  # non-interactive

set -euo pipefail

# Flags
PROFILE=""
APP_NAME=""
APP_SLUG=""
APP_SCHEME=""
BUNDLE_ID=""
SUPABASE_REF=""
GH_REPO=""
SKIP_EAS_INIT=false
SKIP_SUPABASE_LINK=false

for arg in "$@"; do
  case $arg in
    --profile=*) PROFILE="${arg#*=}" ;;
    --app-name=*) APP_NAME="${arg#*=}" ;;
    --app-slug=*) APP_SLUG="${arg#*=}" ;;
    --app-scheme=*) APP_SCHEME="${arg#*=}" ;;
    --bundle-id=*) BUNDLE_ID="${arg#*=}" ;;
    --supabase-ref=*) SUPABASE_REF="${arg#*=}" ;;
    --gh-repo=*) GH_REPO="${arg#*=}" ;;
    --skip-eas-init) SKIP_EAS_INIT=true ;;
    --skip-supabase-link) SKIP_SUPABASE_LINK=true ;;
    --help|-h)
      cat <<HELP
Usage: bin/setup.sh [OPTIONS]

Interactive setup for forked expo-supabase-template.

OPTIONS:
  --profile=PROFILE          client | internal | demo
  --app-name=NAME            Display name (e.g. "Cutegory")
  --app-slug=SLUG            Expo slug (lowercase, hyphens, e.g. "cutegory")
  --app-scheme=SCHEME        Deep link scheme (e.g. "cutegory")
  --bundle-id=ID             iOS/Android bundle ID (e.g. cz.cutegory.app)
  --supabase-ref=REF         Supabase project ref (skip with --skip-supabase-link)
  --gh-repo=OWNER/REPO       Create GitHub repo (skip if empty)
  --skip-eas-init            Don't run eas init (do later)
  --skip-supabase-link       Don't link Supabase MCP
HELP
      exit 0
      ;;
  esac
done

# Interactive if missing
if [ -z "$APP_NAME" ]; then
  read -rp "App display name (e.g. 'Cutegory'): " APP_NAME
fi
if [ -z "$APP_SLUG" ]; then
  read -rp "Expo slug (lowercase, e.g. 'cutegory'): " APP_SLUG
fi
if [ -z "$APP_SCHEME" ]; then
  read -rp "Deep link scheme (e.g. 'cutegory'): " APP_SCHEME
fi
if [ -z "$BUNDLE_ID" ]; then
  CLIENT="${APP_SLUG}"
  read -rp "Bundle ID [cz.$CLIENT.app]: " BUNDLE_ID
  BUNDLE_ID="${BUNDLE_ID:-cz.$CLIENT.app}"
fi

# Replace placeholders in app.json
echo "📝 Replacing placeholders..."
SED_IN_PLACE=("sed" "-i" "")
if sed --version 2>/dev/null | grep -q GNU; then
  SED_IN_PLACE=("sed" "-i")
fi
"${SED_IN_PLACE[@]}" "s|{{APP_NAME}}|$APP_NAME|g" app.json
"${SED_IN_PLACE[@]}" "s|{{APP_SLUG}}|$APP_SLUG|g" app.json
"${SED_IN_PLACE[@]}" "s|{{APP_SCHEME}}|$APP_SCHEME|g" app.json
"${SED_IN_PLACE[@]}" "s|cz.{{CLIENT}}.app|$BUNDLE_ID|g" app.json
"${SED_IN_PLACE[@]}" "s|{{APP_NAME}}|$APP_NAME|g" package.json 2>/dev/null || true

# Create .env.local from .example if not exists
if [ ! -f .env.local ]; then
  cp .env.local.example .env.local
  echo "📋 Created .env.local — fill in values before running 'bun run dev'"
fi

# Optional Supabase link
if [ -n "$SUPABASE_REF" ] && [ "$SKIP_SUPABASE_LINK" = false ]; then
  echo "🔗 Linking Supabase project ref: $SUPABASE_REF"
  "${SED_IN_PLACE[@]}" "s|PLACEHOLDER_REPLACE_ON_FORK|$SUPABASE_REF|g" .mcp.json
fi

# Optional EAS init
if [ "$SKIP_EAS_INIT" = false ]; then
  if command -v eas &> /dev/null; then
    echo "🚀 EAS init..."
    eas init --non-interactive --force || echo "⚠️  eas init failed — run manually later"
  else
    echo "⚠️  EAS CLI not installed. Install: bun add -g eas-cli  (then run: eas init)"
  fi
fi

# Optional GitHub repo
if [ -n "$GH_REPO" ]; then
  if command -v gh &> /dev/null; then
    echo "🐙 Creating GitHub repo: $GH_REPO"
    gh repo create "$GH_REPO" --private --source=. --remote=origin --push || echo "⚠️  gh repo create failed — do manually"
  else
    echo "⚠️  gh CLI not installed. Skipping GitHub repo creation."
  fi
fi

# Verify
echo ""
echo "🔍 Verifying..."
bun install
bunx tsc --noEmit && echo "✅ tsc clean"
bunx biome check . 2>&1 | tail -3

echo ""
echo "✨ Done! Next steps:"
echo "  1. Fill in .env.local with Supabase + PostHog + Sentry keys"
echo "  2. bin/eas-secrets.sh   (push to EAS Secrets)"
echo "  3. bun run dev          (Metro bundler + QR for Expo Go)"
echo "  4. Read docs/FIRST-FORK-RUNBOOK.md for full walkthrough"
