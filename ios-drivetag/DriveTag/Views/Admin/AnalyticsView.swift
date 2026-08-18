import Charts
import SwiftUI

/// Analytics dashboard available to analysts, moderators, and admins.
struct AnalyticsView: View {
    @State private var pellets: [Pellet] = []
    @State private var users: [AppUser] = []
    @State private var isLoading: Bool = true
    @State private var loadFailed: Bool = false

    private struct DayBucket: Identifiable {
        var id: Date { day }
        var day: Date
        var positive: Int
        var negative: Int
    }

    /// Tag volume grouped by day for the last two weeks.
    private var dailyBuckets: [DayBucket] {
        let calendar = Calendar.current
        let cutoff = calendar.date(byAdding: .day, value: -13, to: calendar.startOfDay(for: .now)) ?? .now

        var grouped: [Date: (positive: Int, negative: Int)] = [:]
        for pellet in pellets {
            let day = calendar.startOfDay(for: pellet.date)
            guard day >= cutoff else { continue }
            var entry = grouped[day] ?? (0, 0)
            if pellet.type == .positive { entry.positive += 1 } else { entry.negative += 1 }
            grouped[day] = entry
        }

        return (0..<14).compactMap { offset -> DayBucket? in
            guard let day = calendar.date(byAdding: .day, value: offset, to: cutoff) else { return nil }
            let entry = grouped[day] ?? (0, 0)
            return DayBucket(day: day, positive: entry.positive, negative: entry.negative)
        }
    }

    private var topReasons: [(reason: String, count: Int)] {
        var counts: [String: Int] = [:]
        for pellet in pellets where !pellet.notes.isEmpty {
            counts[pellet.notes, default: 0] += 1
        }
        return counts.sorted { $0.value > $1.value }.prefix(6).map { (reason: $0.key, count: $0.value) }
    }

    private var stateDistribution: [(state: String, count: Int)] {
        var counts: [String: Int] = [:]
        for pellet in pellets {
            let prefix = pellet.licensePlate.split(separator: "-").first.map(String.init) ?? ""
            guard prefix.count == 2 else { continue }
            counts[prefix, default: 0] += 1
        }
        return counts.sorted { $0.value > $1.value }.prefix(8).map { (state: $0.key, count: $0.value) }
    }

    private var roleDistribution: [(label: String, count: Int)] {
        var counts: [String: Int] = ["User": 0]
        for user in users {
            let key = user.adminRole?.label ?? "User"
            counts[key, default: 0] += 1
        }
        return counts.filter { $0.value > 0 }.sorted { $0.value > $1.value }.map { (label: $0.key, count: $0.value) }
    }

    private var activeUserCount: Int {
        Set(pellets.map(\.createdBy)).count
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if isLoading {
                    ProgressView("Loading analytics…").padding(.vertical, 60)
                } else if loadFailed && pellets.isEmpty && users.isEmpty {
                    EmptyStateView(
                        systemImage: "wifi.slash",
                        title: "Couldn't load analytics",
                        message: "Check your connection and pull to refresh."
                    )
                } else {
                    kpiGrid
                    volumeChart
                    sentimentChart
                    reasonsCard
                    statesCard
                    rolesCard
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Analytics")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable { await load() }
        .task { await load() }
    }

    // MARK: - KPIs

    private var kpiGrid: some View {
        LazyVGrid(columns: Array(repeating: GridItem(spacing: 12), count: 2), spacing: 12) {
            kpiTile("Total Tags", value: "\(pellets.count)", systemImage: "tag.fill", tint: AppTheme.primary)
            kpiTile("Registered Users", value: "\(users.count)", systemImage: "person.2.fill", tint: AppTheme.secondary)
            kpiTile("Positive", value: "\(pellets.filter { $0.type == .positive }.count)", systemImage: "hand.thumbsup.fill", tint: AppTheme.success)
            kpiTile("Negative", value: "\(pellets.filter { $0.type == .negative }.count)", systemImage: "hand.thumbsdown.fill", tint: AppTheme.error)
            kpiTile("Active Taggers", value: "\(activeUserCount)", systemImage: "bolt.fill", tint: AppTheme.violet)
            kpiTile("With Location", value: "\(pellets.filter { $0.latitude != nil }.count)", systemImage: "location.fill", tint: AppTheme.analyticsBlue)
        }
    }

    private func kpiTile(_ label: String, value: String, systemImage: String, tint: Color) -> some View {
        CardContainer(padding: 12) {
            VStack(alignment: .leading, spacing: 7) {
                Image(systemName: systemImage)
                    .font(.caption)
                    .foregroundStyle(tint)
                    .frame(width: 30, height: 30)
                    .background(tint.opacity(0.14), in: .rect(cornerRadius: 9))
                Text(value)
                    .font(.title2.weight(.bold))
                    .contentTransition(.numericText())
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Charts

    private var volumeChart: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "Tags — Last 14 Days")

                Chart {
                    ForEach(dailyBuckets) { bucket in
                        BarMark(
                            x: .value("Day", bucket.day, unit: .day),
                            y: .value("Tags", bucket.positive)
                        )
                        .foregroundStyle(AppTheme.success)

                        BarMark(
                            x: .value("Day", bucket.day, unit: .day),
                            y: .value("Tags", bucket.negative)
                        )
                        .foregroundStyle(AppTheme.error)
                    }
                }
                .chartLegend(.hidden)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 3)) { _ in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.month(.abbreviated).day())
                    }
                }
                .frame(height: 170)

                HStack(spacing: 16) {
                    legendDot("Positive", tint: AppTheme.success)
                    legendDot("Negative", tint: AppTheme.error)
                }
            }
        }
    }

    private var sentimentChart: some View {
        let positive = pellets.filter { $0.type == .positive }.count
        let negative = pellets.count - positive

        return CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "Sentiment Split")

                if pellets.isEmpty {
                    Text("No tags recorded yet.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    Chart {
                        SectorMark(
                            angle: .value("Positive", positive),
                            innerRadius: .ratio(0.6),
                            angularInset: 2
                        )
                        .foregroundStyle(AppTheme.success)

                        SectorMark(
                            angle: .value("Negative", negative),
                            innerRadius: .ratio(0.6),
                            angularInset: 2
                        )
                        .foregroundStyle(AppTheme.error)
                    }
                    .frame(height: 160)

                    HStack(spacing: 16) {
                        legendDot("Positive \(percentage(positive))", tint: AppTheme.success)
                        legendDot("Negative \(percentage(negative))", tint: AppTheme.error)
                    }
                }
            }
        }
    }

    private func percentage(_ value: Int) -> String {
        guard !pellets.isEmpty else { return "0%" }
        return "\(Int((Double(value) / Double(pellets.count) * 100).rounded()))%"
    }

    private func legendDot(_ label: String, tint: Color) -> some View {
        HStack(spacing: 5) {
            Circle().fill(tint).frame(width: 8, height: 8)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
    }

    // MARK: - Breakdown lists

    private var reasonsCard: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "Top Reasons")
                if topReasons.isEmpty {
                    Text("No reasons recorded yet.").font(.subheadline).foregroundStyle(.secondary)
                } else {
                    ForEach(Array(topReasons.enumerated()), id: \.offset) { index, item in
                        barRow(
                            label: item.reason,
                            count: item.count,
                            maxCount: topReasons.first?.count ?? 1,
                            tint: index == 0 ? AppTheme.primary : AppTheme.primary.opacity(0.6)
                        )
                    }
                }
            }
        }
    }

    private var statesCard: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "Most Tagged States")
                if stateDistribution.isEmpty {
                    Text("No state data yet.").font(.subheadline).foregroundStyle(.secondary)
                } else {
                    ForEach(Array(stateDistribution.enumerated()), id: \.offset) { _, item in
                        barRow(
                            label: item.state,
                            count: item.count,
                            maxCount: stateDistribution.first?.count ?? 1,
                            tint: AppTheme.secondary
                        )
                    }
                }
            }
        }
    }

    private var rolesCard: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "Roles")
                ForEach(Array(roleDistribution.enumerated()), id: \.offset) { _, item in
                    barRow(
                        label: item.label,
                        count: item.count,
                        maxCount: roleDistribution.first?.count ?? 1,
                        tint: AppTheme.violet
                    )
                }
            }
        }
    }

    private func barRow(label: String, count: Int, maxCount: Int, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(label)
                    .font(.caption)
                    .lineLimit(1)
                Spacer()
                Text("\(count)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(tint)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.primary.opacity(0.07))
                    Capsule()
                        .fill(tint)
                        .frame(width: max(4, geo.size.width * (Double(count) / Double(max(1, maxCount)))))
                }
            }
            .frame(height: 6)
        }
    }

    // MARK: - Data

    private func load() async {
        loadFailed = false
        do {
            let fetchedPellets = try await PelletService.shared.fetchAll()
            let fetchedUsers = try await UserService.shared.fetchAllUsers()
            pellets = fetchedPellets
            users = fetchedUsers
        } catch {
            loadFailed = true
        }
        isLoading = false
    }
}
