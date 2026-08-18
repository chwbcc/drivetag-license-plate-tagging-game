import SwiftUI

/// Pellet packs, record cleanup, and donation tiers.
struct ShopView: View {
    @Environment(AuthStore.self) private var auth

    private enum Segment: Hashable { case negative, positive, cleanup, support }

    @State private var segment: Segment = .negative
    @State private var pendingItem: ShopItem?
    @State private var processingItemID: String?
    @State private var resultMessage: String?
    @State private var errorMessage: String?

    private var user: AppUser { auth.user ?? .placeholder }

    private var visibleItems: [ShopItem] {
        switch segment {
        case .negative: return ShopCatalog.negativePacks()
        case .positive: return ShopCatalog.positivePacks()
        case .cleanup: return ShopCatalog.items(kind: .erase)
        case .support: return ShopCatalog.items(kind: .donation)
        }
    }

    private var segmentTint: Color {
        switch segment {
        case .negative: return AppTheme.error
        case .positive: return AppTheme.success
        case .cleanup: return AppTheme.primary
        case .support: return AppTheme.secondary
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    balanceCard

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    ChipPicker(
                        options: [
                            (value: Segment.negative, label: "Negative", systemImage: "hand.thumbsdown.fill"),
                            (value: Segment.positive, label: "Positive", systemImage: "hand.thumbsup.fill"),
                        ],
                        selection: $segment,
                        tint: segmentTint
                    )

                    ChipPicker(
                        options: [
                            (value: Segment.cleanup, label: "Clean Record", systemImage: "eraser.fill"),
                            (value: Segment.support, label: "Support Us", systemImage: "heart.fill"),
                        ],
                        selection: $segment,
                        tint: segmentTint
                    )

                    VStack(spacing: 10) {
                        ForEach(visibleItems) { item in
                            itemRow(item)
                        }
                    }

                    if segment == .cleanup {
                        cleanupNote
                    }

                    restoreNote
                }
                .padding(16)
                .padding(.bottom, 60)
            }
            .background(Color.appBackground)
            .navigationTitle("Shop")
            .animation(.smooth(duration: 0.25), value: segment)
            .refreshable { await auth.refresh() }
            .confirmationDialog(
                pendingItem.map { "Buy \($0.name) for \($0.formattedPrice)?" } ?? "",
                isPresented: .constant(pendingItem != nil),
                titleVisibility: .visible
            ) {
                if let item = pendingItem {
                    Button("Confirm \(item.formattedPrice)") {
                        let target = item
                        pendingItem = nil
                        purchase(target)
                    }
                }
                Button("Cancel", role: .cancel) { pendingItem = nil }
            }
            .alert("Done", isPresented: .constant(resultMessage != nil)) {
                Button("OK") { resultMessage = nil }
            } message: {
                Text(resultMessage ?? "")
            }
        }
    }

    // MARK: - Balance

    private var balanceCard: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "Your Balance")
                HStack(spacing: 0) {
                    StatPillar(value: "\(user.positivePelletCount)", label: "Positive", tint: AppTheme.success)
                    StatPillar(value: "\(user.pelletCount)", label: "Negative", tint: AppTheme.error)
                    StatPillar(value: "\(user.negativeRatingCount)", label: "On Record", tint: AppTheme.secondary)
                }
            }
        }
    }

    // MARK: - Items

    private func itemRow(_ item: ShopItem) -> some View {
        let tint: Color = {
            switch item.kind {
            case .donation: return AppTheme.secondary
            case .erase: return AppTheme.primary
            case .purchase: return item.pelletType == .positive ? AppTheme.success : AppTheme.error
            }
        }()

        let icon: String = {
            switch item.kind {
            case .donation: return "heart.fill"
            case .erase: return "eraser.fill"
            case .purchase: return item.pelletType == .positive ? "hand.thumbsup.fill" : "hand.thumbsdown.fill"
            }
        }()

        return HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 17))
                .foregroundStyle(tint)
                .frame(width: 42, height: 42)
                .background(tint.opacity(0.14), in: .rect(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 3) {
                Text(item.name)
                    .font(.subheadline.weight(.semibold))
                Text(item.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 8)

            Button {
                errorMessage = nil
                pendingItem = item
            } label: {
                Group {
                    if processingItemID == item.id {
                        ProgressView().tint(.white)
                    } else {
                        Text(item.formattedPrice)
                            .font(.caption.weight(.bold))
                    }
                }
                .frame(minWidth: 62)
                .padding(.vertical, 9)
                .padding(.horizontal, 10)
                .foregroundStyle(.white)
                .background(tint, in: .capsule)
            }
            .buttonStyle(.pressable)
            .disabled(processingItemID != nil)
        }
        .padding(12)
        .background(Color.appCard, in: .rect(cornerRadius: 14))
    }

    private var cleanupNote: some View {
        VStack(alignment: .leading, spacing: 5) {
            Label("How cleanup works", systemImage: "info.circle.fill")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(AppTheme.primary)
            Text("Erasing removes the oldest negative tags from your public record. Your tag history stays visible to moderators.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(AppTheme.primary.opacity(0.1), in: .rect(cornerRadius: 14))
    }

    private var restoreNote: some View {
        Text("Purchases are applied to your DriveTag account immediately.")
            .font(.caption2)
            .foregroundStyle(.secondary)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.top, 4)
    }

    // MARK: - Purchase

    private func purchase(_ item: ShopItem) {
        processingItemID = item.id
        errorMessage = nil

        Task {
            do {
                let outcome = try await PurchaseService.fulfill(item: item, user: user)

                auth.applyLocal { current in
                    switch item.kind {
                    case .purchase:
                        if item.pelletType == .positive {
                            current.positivePelletCount += item.pelletCount ?? 0
                        } else {
                            current.pelletCount += item.pelletCount ?? 0
                        }
                    case .erase:
                        current.negativeRatingCount = outcome.newNegativeRatingCount
                    case .donation:
                        break
                    }
                }

                resultMessage = outcome.message
            } catch {
                errorMessage = error.localizedDescription
            }
            processingItemID = nil
        }
    }
}
