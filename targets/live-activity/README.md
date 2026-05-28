# targets/live-activity — Live Activity skeleton

ActivityKit-based Live Activity with Dynamic Island support (iOS 16.2+).

## Files

| File | Purpose |
|---|---|
| `expo-target.config.json` | `@bacons/apple-targets` config — `type: "activity"`, deployment target 16.2 |
| `live-activity.swift` | `ActivityAttributes` struct + `ActivityConfiguration` (lock screen + Dynamic Island) |

## Required iOS version

- **Minimum:** iOS 16.2 (ActivityKit)
- **Dynamic Island:** iPhone 14 Pro and later (auto-fallback to lock screen banner on other devices)

## Three presentations to design

1. **Lock screen / banner** — main UI in the `ActivityConfiguration` closure
2. **Dynamic Island expanded** — when user long-presses (leading/trailing/bottom regions)
3. **Dynamic Island compact** — default state next to camera (leading + trailing)
4. **Dynamic Island minimal** — when multiple activities share the island

The skeleton implements all four with title + progress percentage.

## Starting a Live Activity from JS

There are two libraries that wrap ActivityKit for React Native. Pick one:

### Option A: `@bacons/apple-targets` (lower level — manual ExtensionStorage)

You write the `ActivityAttributes` Swift struct here, then push updates from
JS via APNs (server side) or local `Activity.update` calls (requires bridging
module).

### Option B: `react-native-widget-extension` (higher level, recommended)

```bash
bun add react-native-widget-extension
```

Provides JS API: `startActivity()`, `updateActivity()`, `endActivity()`.

```ts
import {
  startActivity,
  updateActivity,
  endActivity,
} from "react-native-widget-extension";

await startActivity({
  attributes: { name: "Booking-123" },
  contentState: { title: "Stříhání", subtitle: "Kadeřnictví Novák", progress: 0.0 },
});
```

The widget extension here ignores which JS lib you use — it only cares about
the `ActivityAttributes` struct matching. Adjust `AppActivityAttributes` fields
to match your JS payload.

## Customizing

1. Add fields to `AppActivityAttributes.ContentState` and update JS payload.
2. Update each region (`compactLeading`, `compactTrailing`, etc.) to render them.
3. Test on a physical device (Simulator's Dynamic Island simulation is limited).

## After changing code

```bash
bunx expo prebuild --clean
```

## Deeper docs

- Apple ActivityKit: https://developer.apple.com/documentation/activitykit
- Dynamic Island HIG: https://developer.apple.com/design/human-interface-guidelines/live-activities
- Full runbook: [`docs/runbooks/ios-widgets-howto.md`](../../docs/runbooks/ios-widgets-howto.md)
