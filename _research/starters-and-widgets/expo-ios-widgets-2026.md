# iOS Widgets, Live Activities & App Clips v Expo — 2026 Reality Check

> Researched: 2026-05-25 | Sources: GitHub READMEs + issue trackers + official Expo docs + changelog

---

## TL;DR — Bottom Line

**Lze to — ale není to zadarmo.** Expo + `@bacons/apple-targets` (SDK 53+) umožní přidat Home/Lock Screen widgety, Live Activities, App Clips i základní Watch app do managed Expo projektu **bez ejection** díky Config Plugins + CNG workflow. Ale: **widget UI MUSÍ být v SwiftUI**, EAS Build má kritický bug s RN 0.83 (framework embedding crash), a celý stack je community-maintained alpha/beta — ne Expo first-party. Pro Cutegory P2 to je reálná cesta, ale přijde si na ni Xcode a minimálně základy Swift.

---

## Lze v Expo dělat...

### iOS Home Screen Widgets (WidgetKit)
- **Status: Yes — s podmínkami**
- **How:** `@bacons/apple-targets` config plugin → scaffold Swift widget přes `npx create-target widget` → widget UI v SwiftUI, data sync přes `ExtensionStorage` (App Groups + UserDefaults) → EAS Build + automatické codesigning
- **Learning curve: Medium** — Expo workflow se zachová, ale widget UI = SwiftUI (nelze v JS/React)
- **Stabilita: Beta** — 1.3k stars, aktivně maintainovaný Evanem Baconem (Expo team člen), ale 44 open issues
- **Kritický blocker:** Issue #194 — RN 0.83 + widget extension = crash při spuštění (dyld framework embedding bug). Workaround zatím jen "odeber plugin". Fix pending.
- **Example repo:** https://github.com/EvanBacon/expo-apple-targets (demo app v `/apps/demo`)

### Lock Screen Widgets
- **Status: Yes** — Lock Screen widgety jsou podtyp WidgetKit (rectangular, inline, circular). Stejný přístup jako Home Screen widget.
- **How:** Stejný Swift widget file, přidat `.widgetURL` + `.supportedFamilies([.accessoryRectangular, .accessoryInline, .accessoryCircular])` do widget configuration
- **Minimum iOS:** 16.0+
- **Learning curve: Medium** — identické s Home widget

### Live Activities (ActivityKit)
- **Status: Yes — dvě cesty**
- **Cesta A (doporučená):** `@bacons/apple-targets` s typem `activity` — vytvoří native Swift Live Activity extension, data z RN přes `ExtensionStorage`
- **Cesta B (alternativa):** `react-native-widget-extension` (560 stars, v0.2.0, Oct 2025) — explicitní JS API: `startActivity()`, `updateActivity()`, `endActivity()`. Widget UI stále v Swift, ale control plane v JS.
- **Minimum iOS:** 16.2 (guard s `@available(iOS 16.2, *)`)
- **Learning curve: Medium** — ActivityKit Swift struct + JSON payload design
- **Stabilita:** Beta, community maintained

### Dynamic Island
- **Status: Partial** — Dynamic Island je součást Live Activity (expanded/minimal/compact presentation). Pokud Live Activity funguje, Dynamic Island funguje automaticky.
- **How:** Přidat `.dynamicIsland {}` sekci do `ActivityConfiguration` ve Swift
- **Minimum iOS:** 16.1 (iPhone 14 Pro+)
- **Learning curve: Medium-High** — vyžaduje design 3 prezentací (expanded, compact, minimal)

### App Clips
- **Status: Yes — dvě cesty, obě s caveats**
- **Cesta A:** `@bacons/apple-targets` (`type: "clip"`) — autor sám říká "codesigning není plně automatizován"
- **Cesta B (doporučená):** `react-native-app-clip` (650 stars, v0.8.0, Mar 2026, aktivně maintained) — čistší implementace, keychain data sharing s hlavní app, iOS 15/16/17+
- **Limitace:** Size limit 50 MB, nemůže přistupovat ke všem native APIs, vyžaduje AASA soubor na webserveru pro association
- **Learning curve: Medium** — konfigurace v app.json + AASA web config

### Apple Watch app
- **Status: Partial/Alpha**
- **How:** `@bacons/apple-targets` generuje watchOS target, ale issue #171 říká že framework build phases chybí → SPM dependencies nelze linkovat bez manuálního zásahu do pbxproj
- **Realita:** Watch app je de facto read-only companion (zobrazení dat ze shared storage), interaktivní Watch app s complex native deps = high pain
- **Learning curve: High** — SwiftUI + WatchKit + watchOS specifika + broken tooling
- **Doporučení pro Cutegory:** Odložit na M3+, pokud vůbec

---

## The Hero Library: @bacons/apple-targets

**Autor:** Evan Bacon — člen Expo core týmu, autor Expo Router, maintainer klíčových Expo packages  
**Repo:** https://github.com/EvanBacon/expo-apple-targets  
**Balíček:** `@bacons/apple-targets`  
**Stats:** 1.3k stars, 104 forks, 44 open issues (2026-05-25)  
**SDK požadavek:** Expo SDK 53+ (ne SDK 52!)  
**Xcode požadavek:** Xcode 16 (macOS 15 Sequoia)

### Jak funguje

Config Plugin přídává logiku do Expo's Continuous Native Generation (CNG). Při `npx expo prebuild`:
1. Generuje Xcode target mimo `/ios` složku → targets/ adresář v repo root
2. Přidává `.pbxproj` entries pro nový target
3. Nastavuje App Groups entitlements cross-target
4. Zprostředkuje `ExtensionStorage` JS modul pro data sync

Výsledek: `/ios` složku **stále necommituješ** (CNG), targets/ soubory (Swift) committovat musis.

### Jak to vypadá v Xcode

```
expo:targets/
  widget/
    index.swift      ← tvůj SwiftUI kód
    Info.plist
    Assets.xcassets/
  activity/
    index.swift      ← Live Activity swift struct
```

Xcode vidí `expo:targets` jako virtual folder — editace se promítají do skutečných `/targets/widget/` souborů.

### EAS Build integrace

```
eas build --platform ios
```

EAS Build automaticky:
- Detekuje přítomnost targets/ configuů
- Vytvoří provisioning profiles pro každý bundle ID (main + widget extension = 2 profiles)
- Embedne codesigning

**Caveat App Clips:** Codesigning pro App Clips není 100% automatický — vyžaduje manuální krok v Xcode Signing tab.

**Kritický bug (issue #194):** RN 0.83 (= React Native + SPM místo CocoaPods) + widget extension = startup crash. Bug zatím unresolved. Pokud projekt používá RN 0.83+, NUTNO ověřit před implementací.

### Konfigurace target

```javascript
// targets/widget/expo-target.config.js
module.exports = {
  type: "widget",
  displayName: "Cutegory Widget",
  colors: {
    $accent: "#00B4A2",  // mint green
  },
  entitlements: {
    "com.apple.security.application-groups": ["group.cutegory.data"]
  },
  deploymentTarget: "16.0",
};
```

---

## Code example

**Widget pro "Příští termín u kadeřníka" — Cutegory use-case**

### 1. Setup (terminal)

```bash
npx create-target widget          # scaffold SwiftUI widget
npx expo prebuild -p ios --clean
```

### 2. JS side — zápis dat do shared storage

```typescript
// app/booking/[id].tsx (nebo kdekoli kde víš o příštím termínu)
import { ExtensionStorage } from "@bacons/apple-targets";

const storage = new ExtensionStorage("group.cutegory.data");

async function syncNextBookingToWidget(booking: Booking) {
  storage.set("nextBookingTitle", booking.serviceName);       // "Střih + Barva"
  storage.set("nextBookingDate", booking.startsAt.toISOString()); // "2026-06-02T14:00:00Z"
  storage.set("nextBookingShop", booking.shop.name);          // "Kadeřnictví Novák"
  storage.set("nextBookingAvatar", booking.shop.avatarUrl);   // URL string
  ExtensionStorage.reloadWidget(); // trigger widget refresh
}
```

### 3. Swift widget UI

```swift
// targets/widget/index.swift
import WidgetKit
import SwiftUI

struct NextBookingEntry: TimelineEntry {
    let date: Date
    let title: String
    let shopName: String
    let bookingDate: Date?
}

struct NextBookingProvider: TimelineProvider {
    func getTimeline(in context: Context, completion: @escaping (Timeline<NextBookingEntry>) -> Void) {
        let defaults = UserDefaults(suiteName: "group.cutegory.data")
        let title = defaults?.string(forKey: "nextBookingTitle") ?? "Žádný termín"
        let shopName = defaults?.string(forKey: "nextBookingShop") ?? ""
        let dateStr = defaults?.string(forKey: "nextBookingDate")
        
        var bookingDate: Date? = nil
        if let ds = dateStr {
            bookingDate = ISO8601DateFormatter().date(from: ds)
        }
        
        let entry = NextBookingEntry(
            date: Date(),
            title: title,
            shopName: shopName,
            bookingDate: bookingDate
        )
        let timeline = Timeline(entries: [entry], policy: .never)
        completion(timeline)
    }
    
    func placeholder(in context: Context) -> NextBookingEntry {
        NextBookingEntry(date: Date(), title: "Střih", shopName: "Kadeřnictví", bookingDate: nil)
    }
    
    func getSnapshot(in context: Context, completion: @escaping (NextBookingEntry) -> Void) {
        completion(placeholder(in: context))
    }
}

struct NextBookingWidgetView: View {
    var entry: NextBookingEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Příští termín")
                .font(.caption2)
                .foregroundColor(.secondary)
            Text(entry.title)
                .font(.headline)
                .lineLimit(1)
            Text(entry.shopName)
                .font(.caption)
                .foregroundColor(.secondary)
            if let d = entry.bookingDate {
                Text(d, style: .relative)
                    .font(.caption)
                    .foregroundColor(.accentColor)
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

@main
struct NextBookingWidget: Widget {
    let kind = "NextBookingWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NextBookingProvider()) { entry in
            NextBookingWidgetView(entry: entry)
        }
        .configurationDisplayName("Příští termín")
        .description("Zobrazí tvůj příští termín v Cutegory.")
        .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular])
    }
}
```

### 4. app.json konfigurace

```json
{
  "expo": {
    "plugins": [
      ["@bacons/apple-targets"],
      ["expo-build-properties", {
        "ios": {
          "deploymentTarget": "16.0"
        }
      }]
    ],
    "ios": {
      "bundleIdentifier": "com.cutegory.app",
      "entitlements": {
        "com.apple.security.application-groups": ["group.cutegory.data"]
      }
    }
  }
}
```

---

## Data sharing native widget ↔ JS layer

### App Groups (doporučeno — primární cesta)

```
App Group ID: group.cutegory.data
Entitlement: com.apple.security.application-groups
```

**JS → Widget (write):**
```typescript
import { ExtensionStorage } from "@bacons/apple-targets";
const storage = new ExtensionStorage("group.cutegory.data");
storage.set("key", "value");
ExtensionStorage.reloadWidget(); // invalidate widget cache
```

**Widget → čtení (Swift):**
```swift
let defaults = UserDefaults(suiteName: "group.cutegory.data")
let value = defaults?.string(forKey: "key")
```

### Keychain Sharing (pro citlivá data)

Používá `react-native-app-clip` pro sdílení dat mezi App Clip a hlavní aplikací. Alternativně `expo-secure-store` s `keychainAccessGroup`.

```json
// app.json
"ios": {
  "entitlements": {
    "keychain-access-groups": ["TEAMID.com.cutegory.app"]
  }
}
```

### Shared UserDefaults vs. Keychain — kdy co

| Typ dat | Mechanismus |
|---------|-------------|
| Booking data (datum, název) | App Groups UserDefaults |
| Auth tokens | Keychain Sharing |
| App Clip → main app handoff | Keychain (persists po instalaci) |
| Live Activity payload | ActivityKit push / direct update |

---

## Production apps using this

1. **Pillar Valley** (Evan Bacon, @bacons) — https://github.com/EvanBacon/pillar-valley — 763 stars, Expo game s App Clip (`appclip.apple.com`). Největší production Expo app s apple-targets integrations od samotného autora.

2. **react-native-widget-extension example app** — https://github.com/bndkt/react-native-widget-extension — demo production app s widgety + Live Activities, fork/production patterns dokumentovány v README.

3. **react-native-app-clip** (bndkt) — https://github.com/bndkt/react-native-app-clip — 650 stars, v0.8.0 (Mar 2026), aktivně maintainovaný. Používán v production Expo apps (20+ releases, 43 total).

---

## Petr's decision tree

### Milestone 1 (Supabase auth + data): Nic nového
Žádný widget, žádný native extension. Čistý Expo SDK 53 managed. Hotov za AI-execution ~5 kroků.

### Milestone 2 (Booking flow — P1):
**Možná Live Activity** pro "Tvůj termín za 30 min"
- Prereq: ověřit issue #194 status (RN 0.83 crash fix)
- Stack: `@bacons/apple-targets` + Swift ActivityKit struct + `react-native-widget-extension` JS API
- Effort: 1-2 dny human (Swift boilerplate + testing na real device)

### Milestone 3+ (P2 advanced):
**Home Screen + Lock Screen widget**
- Stack: `@bacons/apple-targets` widget type
- Swift widget UI: ~100 LOC (viz code example výše)
- EAS Build: automatické (po fix issue #194)
- Effort: 1 den human pro základní widget

### Milestone 4+ (P3, "nice to have"):
**App Clip**
- Stack: `react-native-app-clip` (650 stars, v0.8.0) — preferuj nad `@bacons/apple-targets` clip typem (codesigning je vyřešený)
- Use case: zákazník dostane odkaz → App Clip → booking flow → install full app
- Effort: 2-3 dny human (AASA, size limit, App Store review)

**Watch app — SKIP pro teď**
- Issue #171 (missing framework build phases) není resolved
- Cutegory use-case je borderline: watch je UX nice-to-have, ne business critical
- Revisit Q4 2026 nebo až issue #171 merged

### Doporučení

**Stay on Expo managed + `@bacons/apple-targets`** pokud:
- Projekt je SDK 53+ (NE 52)
- Issue #194 (RN 0.83 crash) je resolved nebo projekt ještě neupgradoval na RN 0.83
- Tým má alespoň základní Swift znalosti pro widget UI (nelze v JS)

**Eject to bare workflow POUZE pokud:**
- Potřebuješ plnou Swift/Objective-C integraci napříč celou app (ne jen extensions)
- Enterprise signing vyžaduje full Xcode kontrolu
- Performance-critical native modules nejdou přes Expo Modules API

**Hybrid (managed + native targets) — DOPORUČENO pro Cutegory:**
- Expo managed pro vše (RN, navigation, Supabase, auth)
- `@bacons/apple-targets` pro widget/Live Activity extensions (izolované Swift targets)
- `react-native-app-clip` pro App Clip (nejstabilnější volba)
- Žádný ejection = zachováváš EAS Build + OTA updates + Expo DevTools

---

## Anti-patterns

1. **NEDĚLAT: React Native kód v widgetu** — Widget UI MUSÍ být SwiftUI. Žádné workaroundy (WebView v widgetu = App Store rejection). Expo/RN nemá žádnou cestu jak renderovat JS v WidgetKit.

2. **NEDĚLAT: expo-apple-targets s RN 0.83 bez ověření issue #194** — Startup crash. Ověř GitHub issue #194 status před implementací.

3. **NEDĚLAT: přímý zápis do UserDefaults bez App Groups** — Widget a hlavní app jsou separate processes. Bez `suiteName: "group.xxx"` data nevidí widget.

4. **NEDĚLAT: widget volání Supabase JS SDK přímo** — Widget je Swift-only, no Node.js runtime. Data se přenáší přes shared UserDefaults (App Groups), ne přes JS SDK.

5. **NEDĚLAT: committovat /ios složku** — S CNG workflow (`@bacons/apple-targets`) stačí commitovat `targets/` adresář. Commitování `/ios` = conflict s CNG generací.

6. **NEDĚLAT: testovat widgety jen v simulátoru** — App Clips a Live Activities mají v simulátoru omezené chování. Real device testing je mandatory před EAS Submit.

7. **NEDĚLAT: App Clip > 50 MB** — Apple hard limit. Neimportuj celý React Native bundle do App Clip. Viz `react-native-app-clip` excludePackages konfigurace.

---

## References

### Primární zdroje (live scrape 2026-05-25)
- https://github.com/EvanBacon/expo-apple-targets — hlavní lib, 1.3k stars
- https://github.com/bndkt/react-native-widget-extension — 560 stars, v0.2.0 (Oct 2025)
- https://github.com/bndkt/react-native-app-clip — 650 stars, v0.8.0 (Mar 2026)
- https://github.com/EvanBacon/expo-apple-targets/issues/194 — kritický RN 0.83 crash bug
- https://github.com/EvanBacon/expo-apple-targets/issues/171 — watchOS framework bug
- https://expo.dev/changelog/sdk-53 — SDK 53 release notes (widgets ne v core)

### Dokumentace
- https://docs.expo.dev/versions/latest/config/app/#ios — Expo iOS app config
- https://developer.apple.com/documentation/activitykit — Apple ActivityKit docs
- https://developer.apple.com/documentation/widgetkit — Apple WidgetKit docs

### Known good patterns
- Evan Bacon's Pillar Valley: https://github.com/EvanBacon/pillar-valley (App Clip production)
- react-native-app-clip examples: https://github.com/bndkt/react-native-app-clip/tree/main/example

---

*Researched by research-loop agent | 2026-05-25 | Sources: 15 live URLs scraped*
