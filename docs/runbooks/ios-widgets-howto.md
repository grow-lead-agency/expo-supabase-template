# iOS Widgets, Live Activities & App Clips — Howto

> Opt-in for the `expo-supabase-template`. Powered by [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets) (beta).
> Deeper rationale + research: [`_research/starters-and-widgets/expo-ios-widgets-2026.md`](../../_research/starters-and-widgets/expo-ios-widgets-2026.md).

---

## TL;DR

- Widgets are **NOT enabled by default** in this template.
- Activate by running `bin/setup-widgets.sh` after `bin/setup.sh`.
- Widget UI is **Swift only** (you write `targets/widget/widget.swift`).
- Data flows JS → App Groups (`UserDefaults`) → widget. SecureStore is not visible to the extension.
- Requires SDK 56+ (RN 0.85+) to avoid the dyld framework crash from `@bacons/apple-targets#194`.

---

## When to add widgets

✅ **Good fit:**

- Customer-facing apps with daily-glance value (next booking, balance, latest order, recent notification).
- Apps where users open the home/lock screen multiple times a day.
- Live status (e.g., "Booking confirmed in 30 min" → Live Activity + Dynamic Island).
- Cutegory-class consumer apps.

❌ **Bad fit:**

- Internal staff/back-office tools (users open the app intentionally; no widget value).
- MVP / week-one development (focus on the core flow first).
- Apps not on the App Store yet (widgets need real provisioning).
- Apps that need data fresher than every ~5 min and can't push from a server (WidgetKit refresh budget is conservative).

---

## Quick install

```bash
# After bin/setup.sh has run:
bin/setup-widgets.sh
```

What it does:

1. Installs `@bacons/apple-targets` via `bun add`.
2. Adds `"@bacons/apple-targets"` to `app.json` `expo.plugins`.
3. Replaces `{{BUNDLE_ID}}` and App Group placeholders in `targets/`.
4. Copies `targets/widget/widget-storage.ts.template` → `src/lib/widget-storage.ts`.

Then customize `targets/widget/widget.swift` and run:

```bash
bunx expo prebuild --clean
eas build --profile preview --platform ios
```

---

## How data flows

```
[ React Native — app logic ]
      │
      │  await widgetStorage.setTitle("Next booking")
      │  await widgetStorage.setSubtitle("14:00 — Novák")
      │  await widgetStorage.reloadAllTimelines()
      ▼
[ ExtensionStorage  — @bacons/apple-targets ]
      │  writes to shared UserDefaults under suite name
      ▼
[ App Group  — UserDefaults(suiteName: "group.<bundleId>") ]
      │
      ▼
[ Swift widget extension — TimelineProvider in widget.swift ]
      │
      ▼
[ SwiftUI rendering — Home / Lock Screen ]
```

### App Groups setup (already wired)

- `bin/setup-widgets.sh` reads `expo.ios.bundleIdentifier` from `app.json` and sets the App Group to `group.<bundleId>` in three places:
  - `targets/widget/expo-target.config.json` → widget entitlements
  - `targets/widget/widget.swift` → `let appGroup = "group.<bundleId>"`
  - `src/lib/widget-storage.ts` → `const APP_GROUP = "group.<bundleId>"`
- Expo's CNG injects the matching `com.apple.security.application-groups` entitlement into the main app on `prebuild`.

You do **not** need to register the App Group manually in Apple Developer portal — EAS Build handles it. The App Group ID itself just needs to be consistent on all three sides.

### Why not SecureStore?

The widget extension is a separate process with its own sandbox. It can read shared `UserDefaults` (via App Group) but **not** the main app's Keychain item by default. Putting auth tokens in the widget is generally also a bad idea — display data only.

---

## Widget types

| Type | Family constants | Min iOS | Notes |
|---|---|---|---|
| Home Screen Small | `.systemSmall` | 14+ | 1 line of data, ~155×155 pt |
| Home Screen Medium | `.systemMedium` | 14+ | 2-3 lines, ~329×155 pt |
| Home Screen Large | `.systemLarge` | 14+ | List-style, ~329×345 pt |
| Lock Screen Rectangular | `.accessoryRectangular` | 16+ | 2 lines, monochrome |
| Lock Screen Inline | `.accessoryInline` | 16+ | 1 short line above clock |
| Lock Screen Circular | `.accessoryCircular` | 16+ | 2 chars or progress ring |
| Live Activity (lock) | `ActivityConfiguration` | 16.2+ | Banner-style |
| Dynamic Island | compact/expanded/minimal | 16.1+ (14 Pro+) | Part of Live Activity |

The skeleton in `targets/widget/widget.swift` supports all six widget families. Edit `supportedFamilies([...])` to opt-in/out.

---

## Customizing the widget UI

1. **Add fields** to `AppWidgetEntry`:
   ```swift
   struct AppWidgetEntry: TimelineEntry {
       let date: Date
       let title: String
       let subtitle: String
       let imageUrl: String?   // new
   }
   ```

2. **Read them** in `readEntry()`:
   ```swift
   let imageUrl = defaults?.string(forKey: "widget.imageUrl")
   ```

3. **Render them** in `homeScreenView`:
   ```swift
   if let url = entry.imageUrl, let imageUrl = URL(string: url) {
       AsyncImage(url: imageUrl) { image in image.resizable() } placeholder: { Color.gray }
   }
   ```

4. **Write from JS:**
   ```ts
   await widgetStorage.set("widget.imageUrl", booking.shopAvatarUrl);
   await widgetStorage.reloadAllTimelines();
   ```

Keep keys consistent — that's the only contract between the two sides.

### Refresh policy

The skeleton uses `Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(60 * 30)))` — widget asks the system for a new timeline ~30 min later. Adjust per data freshness, but iOS may throttle frequent requests.

Force-refresh on demand:
```ts
await widgetStorage.reloadAllTimelines();   // call this whenever data changes
```

### SwiftUI basics

- `VStack`, `HStack`, `ZStack` — Swift's flexbox-ish.
- `.font(.headline)`, `.font(.caption)` — like Tailwind text-* classes.
- `.foregroundColor(.secondary)` — auto light/dark.
- `.containerBackground(.fill.tertiary, for: .widget)` — required in iOS 17+ for widget bg.

Apple docs: https://developer.apple.com/tutorials/swiftui

---

## Live Activities & Dynamic Island

Skeleton in `targets/live-activity/live-activity.swift`. Needs iOS 16.2+.

Two approaches to start/update from JS:

### Approach A: `react-native-widget-extension` (recommended)

```bash
bun add react-native-widget-extension
```

```ts
import { startActivity, updateActivity, endActivity } from "react-native-widget-extension";

const activityId = await startActivity({
  attributes: { name: "Booking-123" },
  contentState: { title: "Stříhání", subtitle: "Novák", progress: 0.0 },
});

// Later…
await updateActivity(activityId, { title: "Stříhání", subtitle: "Novák", progress: 0.5 });

// On completion…
await endActivity(activityId);
```

The `ContentState` struct in `live-activity.swift` must match the JS payload field-for-field.

### Approach B: APNs push (server-side)

For background updates without the app being open. Configure APNs key in Apple Dev portal, send push to `liveactivity` topic. See Apple's [Live Activity push reference](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications).

### Dynamic Island

Already wired in `live-activity.swift`. iOS picks the right presentation:
- 14 Pro+ on home screen → compact (next to camera)
- 14 Pro+ long-press → expanded
- Older devices or Live Activity stack → lock screen banner

---

## App Clips

Not pre-wired in this template (template stays minimal). When needed:

```bash
bun add react-native-app-clip
```

Prefer `react-native-app-clip` (bndkt, 650 stars, v0.8.0+, codesigning works) over `@bacons/apple-targets` App Clip type (codesigning manual per author).

Hard requirements:
- AASA file on your domain (`/.well-known/apple-app-site-association`)
- App Clip bundle < 50 MB
- Apple App Store review (App Clip ships through the main App Store listing)

See https://github.com/bndkt/react-native-app-clip for setup.

---

## Testing

### Xcode preview

In Xcode → open `widget.swift` → canvas preview pane:
- Live preview SwiftUI without building.
- Limited fidelity for Live Activity; OK for Home/Lock Screen widgets.

### iOS Simulator

- Long-press home screen → "+" → search for your widget name → add.
- Lock the simulator (Cmd+L) to test Lock Screen widgets.
- Live Activities: limited support in Simulator — use a real device.

### Physical device

- Required for accurate Dynamic Island, push, and final App Store review.
- Connect device → `eas build --profile development --platform ios` → install via QR.

---

## Known gotchas

1. **RN 0.83 + widget = crash** ([#194](https://github.com/EvanBacon/expo-apple-targets/issues/194))
   - SDK 56 uses RN 0.85 — should be fixed. Verify before shipping.

2. **Watch app: missing framework build phases** ([#171](https://github.com/EvanBacon/expo-apple-targets/issues/171))
   - SPM dependencies don't link automatically. Watch target is alpha. Skip for now.

3. **App Clip codesigning not 100% automated** in `@bacons/apple-targets`
   - Use `react-native-app-clip` instead (signing is solved there).

4. **Tailwind v4 incompatible** with NativeWind v4 (already pinned to v3.4 in `package.json`)
   - Don't bump Tailwind in widget setup either — irrelevant (widget is Swift) but worth noting.

5. **iOS 17+ widget background**
   - Must use `.containerBackground(.fill.tertiary, for: .widget)` modifier. Already in the skeleton.

6. **Don't commit `/ios`**
   - CNG regenerates it on `prebuild`. Commit `targets/` only. (Same rule as before.)

7. **Don't put React Native code in the widget**
   - Widget UI must be SwiftUI. WebView in a widget = App Store rejection.

8. **Don't call Supabase JS SDK from the widget**
   - Widget has no Node runtime. Data transfer must go through App Groups (or APNs push for Live Activity updates).

---

## Deintegrating

If you decide widgets aren't a fit:

```bash
# 1. Remove the package
bun remove @bacons/apple-targets

# 2. Remove the plugin from app.json (manual edit — drop "@bacons/apple-targets" from expo.plugins)

# 3. Delete generated JS helper
rm -f src/lib/widget-storage.ts

# 4. (Optional) keep targets/ for later, or delete:
# rm -rf targets/

# 5. Regenerate native dirs
bunx expo prebuild --clean
```

---

## References

- Feasibility research: [`_research/starters-and-widgets/expo-ios-widgets-2026.md`](../../_research/starters-and-widgets/expo-ios-widgets-2026.md) (full rationale + Cutegory use-case)
- `@bacons/apple-targets`: https://github.com/EvanBacon/expo-apple-targets
- `react-native-widget-extension`: https://github.com/bndkt/react-native-widget-extension
- `react-native-app-clip`: https://github.com/bndkt/react-native-app-clip
- Apple WidgetKit: https://developer.apple.com/documentation/widgetkit
- Apple ActivityKit: https://developer.apple.com/documentation/activitykit
- `expo` skill (widget triggers reference PROD-2665): `~/Developer/agents-and-skills/skills/dev/coding/expo/SKILL.md`

<!-- Origin: GrowLead expo-supabase-template | Linear: PROD-2665 -->

---

## Known issues — verified in R8 smoke test (2026-07-13)

1. **Live Activity target is DISABLED by default.** `targets/live-activity/expo-target.config.json.example`
   must stay renamed — the skeleton's `"type": "activity"` does not exist in `@bacons/apple-targets` 4.0.7
   and kills the whole prebuild (`TypeError: ... reading 'frameworks'`). Live Activities belong INSIDE the
   widget extension (ActivityKit ships in the widget bundle) — migrate the swift there when you need it.
2. **Widget skeleton needs iOS 17+.** `containerBackground(.fill.tertiary, for: .widget)` is an iOS 17 API —
   `deploymentTarget` is set to `17.0`. Don't lower it without replacing that call.
3. **Re-running prebuild over an existing widget target fails** ("Cannot read properties of undefined
   (reading 'removeFromProject')"). Always use `bunx expo prebuild --clean` after changing target config.
4. **`ios.appleTeamId` warning** — the plugin wants a team ID in app config. Simulator builds work without
   it; device/TestFlight builds need it (add after Apple Developer enrollment).
