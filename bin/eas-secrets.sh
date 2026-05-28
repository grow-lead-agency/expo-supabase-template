#!/usr/bin/env bash
# Push secrets from .env.local to EAS Secrets — run once per fork
set -euo pipefail

if [ ! -f .env.local ]; then
  echo "❌ .env.local not found. Copy .env.local.example and fill in values."
  exit 1
fi

if ! command -v eas &> /dev/null; then
  echo "❌ EAS CLI not installed. Run: bun add -g eas-cli"
  exit 1
fi

echo "📤 Pushing secrets to EAS..."

# Read .env.local and push each EXPO_PUBLIC_* to EAS
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue

  # Only push EXPO_PUBLIC_* and APPLE_*, ASC_*, ANDROID_* secrets
  if [[ "$key" =~ ^(EXPO_PUBLIC_|APPLE_|ASC_|ANDROID_) ]]; then
    # Strip quotes from value
    value="${value#\"}"
    value="${value%\"}"
    value="${value#\'}"
    value="${value%\'}"

    if [ -n "$value" ]; then
      echo "  → $key"
      eas secret:create --scope project --name "$key" --value "$value" --force 2>&1 | grep -v "^$" || true
    fi
  fi
done < .env.local

echo "✅ EAS secrets pushed. Verify: eas secret:list"
