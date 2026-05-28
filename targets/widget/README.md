# targets/widget — App Widget skeleton

SwiftUI Home Screen + Lock Screen widget powered by WidgetKit.

## Files

| File | Purpose |
|---|---|
| `expo-target.config.json` | `@bacons/apple-targets` config — type, bundle ID, App Group entitlements |
| `widget.swift` | TimelineProvider + SwiftUI views (Home + Lock Screen variants) |
| `widget-bundle.swift` | `@main` entry — registers all widgets exposed by the extension |
| `widget-storage.ts.template` | JS-side helper, copied to `src/lib/widget-storage.ts` by `bin/setup-widgets.sh` |

## Supported families

- **Home Screen:** `systemSmall`, `systemMedium`, `systemLarge`
- **Lock Screen** (iOS 16+): `accessoryRectangular`, `accessoryInline`, `accessoryCircular`

## How data flows

```
[ JS layer / React Native ]
   ↓ widgetStorage.setTitle("Hello")
[ ExtensionStorage (App Groups UserDefaults) ]
   ↓ UserDefaults(suiteName: "group.<bundleId>")
[ Widget extension (Swift) — widget.swift TimelineProvider ]
   ↓ readEntry()
[ SwiftUI rendering on Home/Lock Screen ]
```

## Customizing

1. **Edit `widget.swift`:**
   - Add new fields to `AppWidgetEntry`
   - Update `readEntry()` to load them from `UserDefaults`
   - Update `AppWidgetView` to render them

2. **Edit `widget-storage.ts.template`** (or `src/lib/widget-storage.ts` after `setup-widgets.sh`):
   - Add corresponding `setX()` methods that write to the same keys

3. **Trigger refresh from JS** when data changes:
   ```ts
   await widgetStorage.setTitle("New value");
   await widgetStorage.reloadAllTimelines();
   ```

## App Groups

The App Group ID is set to `group.<bundleId>` by `bin/setup-widgets.sh` based
on `app.json` `expo.ios.bundleIdentifier`. To change manually, search for
`group.cz.PLACEHOLDER.app` in this folder and replace consistently.

The `entitlements` block in `expo-target.config.json` declares the App Group
on the widget side; Expo's CNG also injects the matching entry into the main
app's entitlements on `prebuild`.

## After changing widget code

```bash
bunx expo prebuild --clean
# Then build via EAS or run on a physical device (Simulator preview only)
```

## Deeper docs

- Apple WidgetKit: https://developer.apple.com/documentation/widgetkit
- `@bacons/apple-targets`: https://github.com/EvanBacon/expo-apple-targets
- Full runbook: [`docs/runbooks/ios-widgets-howto.md`](../../docs/runbooks/ios-widgets-howto.md)
- Feasibility research: [`_research/starters-and-widgets/expo-ios-widgets-2026.md`](../../_research/starters-and-widgets/expo-ios-widgets-2026.md)
