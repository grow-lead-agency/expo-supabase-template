#!/usr/bin/env bash
# Opt-in iOS widgets installer for expo-supabase-template.
#
# Installs @bacons/apple-targets, registers the plugin in app.json,
# activates the targets/ skeleton (Expo CNG generates Xcode targets on prebuild),
# and copies the JS-side widget storage helper.
#
# Run AFTER bin/setup.sh has replaced template placeholders.

set -euo pipefail

echo "📱 Installing iOS widgets support..."

# 1. Verify we're in a project root (bin/setup.sh already ran)
if [ ! -f package.json ] || [ ! -f app.json ]; then
  echo "❌ Run from project root (after bin/setup.sh)"
  exit 1
fi

EXPO_VERSION=$(node -p "require('./package.json').dependencies.expo" 2>/dev/null || echo "missing")
if [ "$EXPO_VERSION" = "missing" ]; then
  echo "❌ expo dependency missing in package.json — run bin/setup.sh first"
  exit 1
fi

# 2. Verify targets/ skeleton present
if [ ! -d targets ]; then
  echo "❌ targets/ directory missing. Template may be old — re-fork from latest."
  exit 1
fi

# 3. sed in-place portability (BSD vs GNU)
SED_IN_PLACE=("sed" "-i" "")
if sed --version 2>/dev/null | grep -q GNU; then
  SED_IN_PLACE=("sed" "-i")
fi

# 4. Install @bacons/apple-targets (beta)
echo "📦 Installing @bacons/apple-targets..."
bun add @bacons/apple-targets

# 5. Add plugin to app.json (idempotent)
node <<'NODE'
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('app.json', 'utf8'));
config.expo.plugins = config.expo.plugins || [];
const has = config.expo.plugins.some(
  (p) => p === '@bacons/apple-targets' || (Array.isArray(p) && p[0] === '@bacons/apple-targets')
);
if (!has) {
  config.expo.plugins.push('@bacons/apple-targets');
  fs.writeFileSync('app.json', JSON.stringify(config, null, 2) + '\n');
  console.log('✅ Added @bacons/apple-targets to app.json plugins');
} else {
  console.log('ℹ️  @bacons/apple-targets already in app.json plugins (skipped)');
}
NODE

# 6. Resolve bundle ID for App Group
BUNDLE_ID=$(node -p "require('./app.json').expo.ios.bundleIdentifier" 2>/dev/null || echo "")
if [ -z "$BUNDLE_ID" ] || [ "$BUNDLE_ID" = "undefined" ]; then
  echo "❌ Could not read expo.ios.bundleIdentifier from app.json. Run bin/setup.sh first."
  exit 1
fi
APP_GROUP="group.${BUNDLE_ID}"
echo "🔐 App Group: ${APP_GROUP}"

# 7. Replace {{BUNDLE_ID}} tokens in targets/ configs
for f in targets/widget/expo-target.config.json targets/live-activity/expo-target.config.json; do
  if [ -f "$f" ]; then
    "${SED_IN_PLACE[@]}" "s|{{BUNDLE_ID}}|${BUNDLE_ID}|g" "$f"
  fi
done

# 8. Replace App Group placeholder in widget.swift
if [ -f targets/widget/widget.swift ]; then
  "${SED_IN_PLACE[@]}" "s|group.cz.PLACEHOLDER.app|${APP_GROUP}|g" targets/widget/widget.swift
fi

# 9. Copy + customize widget-storage helper to src/lib/
if [ -f targets/widget/widget-storage.ts.template ]; then
  mkdir -p src/lib
  cp targets/widget/widget-storage.ts.template src/lib/widget-storage.ts
  "${SED_IN_PLACE[@]}" "s|group.cz.PLACEHOLDER.app|${APP_GROUP}|g" src/lib/widget-storage.ts
  echo "✅ Copied src/lib/widget-storage.ts"
fi

echo ""
echo "✨ iOS widgets pre-wired. Next steps:"
echo "  1. Customize targets/widget/widget.swift (SwiftUI UI)"
echo "  2. Customize targets/live-activity/live-activity.swift if you want a Live Activity"
echo "  3. Read targets/widget/README.md and docs/runbooks/ios-widgets-howto.md"
echo "  4. bunx expo prebuild --clean   (regenerates ios/ with widget target)"
echo "  5. Open ios/*.xcworkspace in Xcode to verify the new targets"
echo "  6. eas build --profile preview --platform ios   (test full build)"
echo ""
echo "⚠️  KNOWN ISSUES:"
echo "  - RN 0.83 + widget = crash (@bacons/apple-targets issue #194)."
echo "    SDK 56+ uses RN 0.85 which should be fixed — verify before shipping."
echo "  - SecureStore data is NOT accessible from a widget — use App Groups"
echo "    (already wired via widgetStorage helper)."
echo "  - Widget UI MUST be Swift, not JS — edit targets/widget/widget.swift."
