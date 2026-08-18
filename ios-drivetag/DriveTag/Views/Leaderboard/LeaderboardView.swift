import SwiftUI

/// Anonymized plate rankings plus an experience leaderboard.
struct LeaderboardView: View {
    private enum BoardTab: Hashable { case pellets, experience }

    @State private var tab: BoardTab = .pellets
    @State private var pelletFilter: PelletFilter = .all
    @State private var sortDescending: Bool = true

    @State private var pellets: [Pellet] = []
    @State private var expUsers: [AppUser] = []
    @State private var isLoading: Bool = false
    @State private var loadFailed: Bool = false

    enum PelletFilter: Hashable {
        case all, negative, positive

        var type: PelletType? {
            switch self {
            case .all: return nil
            case .negative: return .negative
            case .positive: return .positive
            }
        }

        var tint: Color {
            switch self {
            case .positive: return AppTheme.success
            case .negative: return AppTheme.error
            case .all: return AppTheme.primary
            }
        }
    }

    /// Aggregated plate → tag count, anonymized for display.
    private struct PlateRanking: Identifiable {
        var id: String
        var anonymizedName: String
        var count: Int
    }

    private var rankings: [PlateRanking] {
        let filtered = pelletFilter.type.map { type in pellets.filter { $0.type == type } } ?? pellets

        var counts: [String: Int] = [:]
        for pellet in filtered where !pellet.licensePlate.isEmpty {
            counts[pellet.licensePlate, default: 0] += 1
        }

        return counts
            .map { PlateRanking(id: $0.key, anonymizedName: Hashing.anonymizePlate($0.key), count: $0.value) }
            .sorted { sortDescending ? $0.count > $1.count : $0.count < $1.count }
    }

    private struct AggregateStats {
        var positivePercentage: Int
        var negativePercentage: Int
        var topReasons: [(reason: String, count: Int)]
    }

    private var stats: AggregateStats? {
        guard !pellets.isEmpty else { return nil }
        let total = pellets.count
        let positive = pellets.filter { $0.type == .positive }.count
        let negative = total - positive

        var reasonCounts: [String: Int] = [:]
        for pellet in pellets where !pellet.notes.isEmpty {
            reasonCounts[pellet.notes, default: 0] += 1
        }
        let top = reasonCounts
            .sorted { $0.value > $1.value }
            .prefix(3)
            .map { (reason: $0.key, count: $0.value) }

        return AggregateStats(
            positivePercentage: Int((Double(positive) / Double(total) * 100).rounded()),
            negativePercentage: Int((Double(negative) / Double(total) * 100).rounded()),
            topReasons: Array(top)
        )
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    if let stats {
                        statsCard(stats)
                    }

                    ChipPicker(
                        options: [
                            (value: BoardTab.pellets, label: "Pellets", systemImage: "trophy.fill"),
                            (value: BoardTab.experience, label: "Experience", systemImage: "rosette"),
                        ],
                        selection: $tab
                    )

                    if tab == .pellets {
                        pelletBoard
                    } else {
                        experienceBoard
                    }
                }
                .padding(16)
                .padding(.bottom, 60)
            }
            .background(Color.appBackground)
            .navigationTitle("Leaderboard")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        withAnimation(.smooth) { sortDescending.toggle() }
                    } label: {
                        Image(systemName: sortDescending ? "arrow.down" : "arrow.up")
                    }
                    .accessibilityLabel(sortDescending ? "Sort ascending" : "Sort descending")
                }
            }
            .refreshable { await load() }
            .task { await load() }
        }
    }

    // MARK: - Stats

    private func statsCard(_ stats: AggregateStats) -> some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 14) {
                SectionLabel(text: "Aggregate Statistics")

                HStack(spacing: 12) {
                    percentTile("\(stats.positivePercentage)%", label: "Positive Tags", tint: AppTheme.success, systemImage: "hand.thumbsup.fill")
                    percentTile("\(stats.negativePercentage)%", label: "Negative Tags", tint: AppTheme.error, systemImage: "hand.thumbsdown.fill")
                }

                if !stats.topReasons.isEmpty {
                    Divider()
                    Text("Top Reasons")
                        .font(.subheadline.weight(.semibold))

                    ForEach(Array(stats.topReasons.enumerated()), id: \.offset) { index, item in
                        HStack(spacing: 8) {
                            Text("\(index + 1).")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(.secondary)
                                .frame(width: 16, alignment: .leading)
                            Text(item.reason)
                                .font(.caption)
                                .lineLimit(1)
                            Spacer()
                            Text("\(item.count)")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(AppTheme.primary)
                        }
                    }
                }
            }
        }
    }

    private func percentTile(_ value: String, label: String, tint: Color, systemImage: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Image(systemName: systemImage)
                .font(.caption)
                .foregroundStyle(tint)
            Text(value)
                .font(.title2.weight(.bold))
                .contentTransition(.numericText())
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(tint.opacity(0.1), in: .rect(cornerRadius: 12))
    }

    // MARK: - Boards

    private var pelletBoard: some View {
        VStack(spacing: 12) {
            ChipPicker(
                options: [
                    (value: PelletFilter.all, label: "All", systemImage: "trophy"),
                    (value: PelletFilter.negative, label: "Negative", systemImage: "hand.thumbsdown"),
                    (value: PelletFilter.positive, label: "Positive", systemImage: "hand.thumbsup"),
                ],
                selection: $pelletFilter,
                tint: pelletFilter.tint
            )

            VStack(alignment: .leading, spacing: 3) {
                Text("Anonymous Driver Rankings")
                    .font(.subheadline.weight(.semibold))
                Text("License plates are anonymized for privacy")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if isLoading && pellets.isEmpty {
                ProgressView().padding(.vertical, 40)
            } else if rankings.isEmpty {
                EmptyStateView(
                    systemImage: loadFailed ? "wifi.slash" : "trophy",
                    title: loadFailed ? "Couldn't load rankings" : "No data yet",
                    message: loadFailed
                        ? "Check your connection and pull to refresh."
                        : "Start tagging drivers to see the leaderboard."
                )
            } else {
                VStack(spacing: 8) {
                    ForEach(Array(rankings.enumerated()), id: \.element.id) { index, entry in
                        rankRow(
                            rank: index + 1,
                            title: entry.anonymizedName,
                            subtitle: nil,
                            value: "\(entry.count)",
                            valueLabel: "pellets",
                            rankTint: pelletFilter.tint
                        )
                    }
                }
            }
        }
    }

    private var experienceBoard: some View {
        VStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text("Experience Rankings")
                    .font(.subheadline.weight(.semibold))
                Text("Top reporters ranked by experience points")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if isLoading && expUsers.isEmpty {
                ProgressView().padding(.vertical, 40)
            } else if expUsers.isEmpty {
                EmptyStateView(
                    systemImage: "rosette",
                    title: "No data yet",
                    message: "Start reporting drivers to earn experience."
                )
            } else {
                VStack(spacing: 8) {
                    ForEach(Array(sortedExpUsers.enumerated()), id: \.element.id) { index, user in
                        rankRow(
                            rank: index + 1,
                            title: user.displayName,
                            subtitle: "Level \(user.level)",
                            value: "\(user.exp)",
                            valueLabel: "EXP",
                            rankTint: AppTheme.secondary
                        )
                    }
                }
            }
        }
    }

    private var sortedExpUsers: [AppUser] {
        expUsers.sorted { sortDescending ? $0.exp > $1.exp : $0.exp < $1.exp }
    }

    private func rankRow(
        rank: Int,
        title: String,
        subtitle: String?,
        value: String,
        valueLabel: String,
        rankTint: Color
    ) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(rank <= 3 ? rankTint : rankTint.opacity(0.4))
                    .frame(width: 34, height: 34)
                Text("\(rank)")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .lineLimit(1)
                if let subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer(minLength: 0)

            VStack(spacing: 0) {
                Text(value)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(rankTint)
                Text(valueLabel)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(Color.appCard, in: .rect(cornerRadius: 12))
    }

    // MARK: - Data

    private func load() async {
        isLoading = true
        loadFailed = false
        do {
            let fetchedPellets = try await PelletService.shared.fetchAll()
            let fetchedUsers = try await UserService.shared.fetchExperienceLeaderboard(ascending: false)
            pellets = fetchedPellets
            expUsers = fetchedUsers.filter { $0.exp > 0 }
        } catch {
            loadFailed = true
        }
        isLoading = false
    }
}
