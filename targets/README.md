# targets/ — Apple Targets (iOS Widgets, Live Activities, App Clips)

This directory holds **opt-in** Apple platform extensions powered by [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets) (Evan Bacon, Expo team).

By default, these targets are **not active** in a freshly forked template. You activate them by running:

```bash
bin/setup-widgets.sh
```

Which:

1. Installs `@bacons/apple-targets` (beta)
2. Adds the plugin to `app.json`
3. Copies the JS-side helper to `src/lib/widget-storage.ts`
4. Replaces App Group placeholder with your bundle ID

After that, run `bunx expo prebuild --clean` to regenerate `ios/` with the new targets.

## What's here

| Folder | Type | Min iOS | Description |
|---|---|---|---|
| `widget/` | `widget` | 16.0 | Home Screen + Lock Screen widget (SwiftUI) |
| `live-activity/` | `activity` | 16.2 | ActivityKit Live Activity + Dynamic Island |

Both folders contain valid SwiftUI placeholders that compile but only show generic content (e.g., "Vítej!"). Customize per project.

## Why opt-in (not auto-enabled)

- `@bacons/apple-targets` is beta (1.3k stars, 44 open issues as of 2026-05-25).
- Widget UI **must** be Swift (not JS) — adds learning curve.
- Not all client apps need widgets — keep template lean.
- Known issue: RN 0.83 + widget extension caused a dyld framework embedding crash ([#194](https://github.com/EvanBacon/expo-apple-targets/issues/194)). RN 0.85 (SDK 56+) should resolve this — but verify before shipping.

## Deintegrating

To remove widgets after enabling them:

```bash
bun remove @bacons/apple-targets
# Edit app.json — drop "@bacons/apple-targets" from plugins array
rm -rf src/lib/widget-storage.ts
rm -rf ios   # regenerate
bunx expo prebuild --clean
```

`targets/` directory can stay (no harm without the plugin) or be deleted.

## Deeper rationale

See [`docs/runbooks/ios-widgets-howto.md`](../docs/runbooks/ios-widgets-howto.md) and the feasibility report in [`_research/starters-and-widgets/expo-ios-widgets-2026.md`](../_research/starters-and-widgets/expo-ios-widgets-2026.md).

<!-- Origin: GrowLead expo-supabase-template | Linear: PROD-2665 -->
