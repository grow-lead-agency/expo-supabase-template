import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct AppWidgetEntry: TimelineEntry {
    let date: Date
    let title: String
    let subtitle: String
}

// MARK: - Timeline Provider

struct AppWidgetProvider: TimelineProvider {
    /// App Group ID — must match entitlements and the JS-side helper
    /// (`src/lib/widget-storage.ts`). `bin/setup-widgets.sh` replaces the
    /// `group.cz.PLACEHOLDER.app` token with `group.<bundleId>` on opt-in.
    let appGroup = "group.cz.PLACEHOLDER.app"

    func placeholder(in context: Context) -> AppWidgetEntry {
        AppWidgetEntry(date: Date(), title: "Načítání…", subtitle: "")
    }

    func getSnapshot(in context: Context, completion: @escaping (AppWidgetEntry) -> Void) {
        completion(readEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AppWidgetEntry>) -> Void) {
        let entry = readEntry()
        // Refresh every 30 min — adjust per data freshness needs.
        let nextRefresh = Date().addingTimeInterval(60 * 30)
        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
        completion(timeline)
    }

    private func readEntry() -> AppWidgetEntry {
        let defaults = UserDefaults(suiteName: appGroup)
        let title = defaults?.string(forKey: "widget.title") ?? "Vítej!"
        let subtitle = defaults?.string(forKey: "widget.subtitle") ?? "Otevřete aplikaci"
        return AppWidgetEntry(date: Date(), title: title, subtitle: subtitle)
    }
}

// MARK: - Views

struct AppWidgetView: View {
    var entry: AppWidgetProvider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall, .systemMedium, .systemLarge:
            homeScreenView
        case .accessoryRectangular:
            lockScreenRectangular
        case .accessoryInline:
            lockScreenInline
        case .accessoryCircular:
            lockScreenCircular
        default:
            Text(entry.title)
        }
    }

    var homeScreenView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.title)
                .font(.headline)
                .lineLimit(1)
            Text(entry.subtitle)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }

    var lockScreenRectangular: some View {
        VStack(alignment: .leading) {
            Text(entry.title)
                .font(.caption)
                .bold()
            Text(entry.subtitle)
                .font(.caption2)
                .lineLimit(1)
        }
    }

    var lockScreenInline: some View {
        Text("\(entry.title) — \(entry.subtitle)")
            .font(.caption)
    }

    var lockScreenCircular: some View {
        Text(entry.title.prefix(2).uppercased())
            .font(.system(.headline, design: .rounded))
    }
}

// MARK: - Widget Configuration

struct AppWidget: Widget {
    let kind: String = "AppWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AppWidgetProvider()) { entry in
            AppWidgetView(entry: entry)
        }
        .configurationDisplayName("App Widget")
        .description("Rychlý pohled do aplikace.")
        .supportedFamilies([
            .systemSmall, .systemMedium, .systemLarge,
            .accessoryRectangular, .accessoryInline, .accessoryCircular
        ])
    }
}
