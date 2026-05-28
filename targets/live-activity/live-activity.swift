import ActivityKit
import WidgetKit
import SwiftUI

// MARK: - Activity Attributes

/// Static + dynamic data for one Live Activity instance.
/// Must mirror the JS-side payload sent via ActivityKit push or local update.
struct AppActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var title: String
        var subtitle: String
        var progress: Double  // 0.0...1.0
    }

    var name: String
}

// MARK: - Widget

@available(iOS 16.2, *)
struct AppLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: AppActivityAttributes.self) { context in
            // Lock screen / banner UI
            VStack(alignment: .leading, spacing: 6) {
                Text(context.state.title)
                    .font(.headline)
                Text(context.state.subtitle)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                ProgressView(value: context.state.progress)
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.6))
            .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.title)
                        .font(.caption)
                        .bold()
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.caption)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: context.state.progress)
                }
            } compactLeading: {
                Text(context.state.title.prefix(8))
                    .font(.caption2)
            } compactTrailing: {
                Text("\(Int(context.state.progress * 100))%")
                    .font(.caption2)
            } minimal: {
                Text("\(Int(context.state.progress * 100))%")
                    .font(.caption2)
            }
        }
    }
}
