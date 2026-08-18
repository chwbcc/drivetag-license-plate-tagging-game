import SwiftUI

/// "Driver Score" home screen: identity, level progress, given/received breakdown, badges.
struct ProfileView: View {
    @Environment(AuthStore.self) private var auth

    @State private var showEditProfile: Bool = false
    @State private var showAdmin: Bool = false
    @State private var showAnalytics: Bool = false
    @State private var showLogoutConfirm: Bool = false

    private var user: AppUser { auth.user ?? .placeholder }

    private var earnedBadges: [Badge] {
        BadgeCatalog.all.filter { user.badges.contains($0.id) }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    identityCard
                    levelCard
                    pelletInventory
                    givenReceivedCard
                    badgesCard
                    logoutButton
                }
                .padding(16)
                .padding(.bottom, 60)
            }
            .background(Color.appBackground)
            .navigationTitle("Driver Score")
            .refreshable { await auth.refresh() }
            .navigationDestination(isPresented: $showEditProfile) { EditProfileView() }
            .navigationDestination(isPresented: $showAdmin) { AdminConsoleView() }
            .navigationDestination(isPresented: $showAnalytics) { AnalyticsView() }
            .task { await auth.refresh() }
            .confirmationDialog("Log out of DriveTag?", isPresented: $showLogoutConfirm, titleVisibility: .visible) {
                Button("Log Out", role: .destructive) { auth.signOut() }
                Button("Cancel", role: .cancel) {}
            }
        }
    }

    // MARK: - Identity

    private var identityCard: some View {
        CardContainer {
            VStack(spacing: 12) {
                HStack(spacing: 12) {
                    avatar

                    VStack(alignment: .leading, spacing: 5) {
                        Text(user.displayName)
                            .font(.headline)
                            .lineLimit(1)
                        PlateBadge(state: user.state, number: user.licensePlate, compact: true)
                    }

                    Spacer(minLength: 0)

                    HStack(spacing: 8) {
                        if let role = user.adminRole, role.canOpenAnalytics {
                            iconButton("chart.bar.fill", tint: AppTheme.analyticsBlue) { showAnalytics = true }
                        }
                        if let role = user.adminRole, role.canOpenAdminConsole {
                            iconButton("shield.fill", tint: AppTheme.adminGold) { showAdmin = true }
                        }
                        iconButton("pencil", tint: AppTheme.primary) { showEditProfile = true }
                    }
                }

                if let role = user.adminRole {
                    Label(role.label, systemImage: "checkmark.seal.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AppTheme.adminGold)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Divider()

                HStack(spacing: 0) {
                    StatPillar(value: "\(user.level)", label: "Level", tint: AppTheme.accentYellow)
                    StatPillar(value: "\(user.exp)", label: "EXP", tint: AppTheme.success)
                    StatPillar(value: "\(earnedBadges.count)", label: "Badges", tint: AppTheme.primary)
                }
            }
        }
    }

    private var avatar: some View {
        Group {
            if let photo = user.photo, let url = URL(string: photo), !photo.isEmpty {
                AsyncImage(url: url) { phase in
                    if let image = phase.image {
                        image.resizable().aspectRatio(contentMode: .fill)
                    } else {
                        avatarFallback
                    }
                }
            } else {
                avatarFallback
            }
        }
        .frame(width: 46, height: 46)
        .clipShape(.circle)
    }

    private var avatarFallback: some View {
        ZStack {
            AppTheme.primary.opacity(0.18)
            Image(systemName: "person.fill")
                .font(.system(size: 20))
                .foregroundStyle(AppTheme.primary)
        }
    }

    private func iconButton(_ systemImage: String, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 32, height: 32)
                .background(tint.opacity(0.15), in: .rect(cornerRadius: 9))
        }
        .buttonStyle(.pressable)
    }

    // MARK: - Level

    private var levelCard: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 10) {
                SectionLabel(text: "Level Progress")
                ExperienceBar(exp: user.exp, level: user.level)
            }
        }
    }

    // MARK: - Inventory

    private var pelletInventory: some View {
        HStack(spacing: 12) {
            inventoryTile(
                count: user.positivePelletCount,
                label: "Positive Pellets",
                systemImage: "hand.thumbsup.fill",
                tint: AppTheme.success
            )
            inventoryTile(
                count: user.pelletCount,
                label: "Negative Pellets",
                systemImage: "hand.thumbsdown.fill",
                tint: AppTheme.error
            )
        }
    }

    private func inventoryTile(count: Int, label: String, systemImage: String, tint: Color) -> some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 8) {
                Image(systemName: systemImage)
                    .font(.system(size: 18))
                    .foregroundStyle(tint)
                    .frame(width: 36, height: 36)
                    .background(tint.opacity(0.15), in: .rect(cornerRadius: 10))

                Text("\(count)")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(tint)
                    .contentTransition(.numericText())

                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Given / received

    private var givenReceivedCard: some View {
        CardContainer {
            VStack(spacing: 16) {
                SectionLabel(text: "Your Record")

                HStack(spacing: 12) {
                    RingGauge(
                        value: user.positiveRatingCount,
                        total: max(1, user.totalReceived),
                        label: "Positive received",
                        tint: AppTheme.success
                    )
                    RingGauge(
                        value: user.negativeRatingCount,
                        total: max(1, user.totalReceived),
                        label: "Negative received",
                        tint: AppTheme.error
                    )
                }
                .frame(maxWidth: .infinity)

                Divider()

                VStack(spacing: 10) {
                    breakdownRow("Tags given", value: user.pelletsGivenCount, tint: AppTheme.primary, systemImage: "paperplane.fill")
                    breakdownRow("Positive given", value: user.positivePelletsGivenCount, tint: AppTheme.success, systemImage: "hand.thumbsup")
                    breakdownRow("Negative given", value: user.negativePelletsGivenCount, tint: AppTheme.error, systemImage: "hand.thumbsdown")
                    breakdownRow("Total received", value: user.totalReceived, tint: AppTheme.secondary, systemImage: "tray.and.arrow.down.fill")
                }
            }
        }
    }

    private func breakdownRow(_ label: String, value: Int, tint: Color, systemImage: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: systemImage)
                .font(.caption)
                .foregroundStyle(tint)
                .frame(width: 26, height: 26)
                .background(tint.opacity(0.14), in: .rect(cornerRadius: 8))
            Text(label)
                .font(.subheadline)
            Spacer()
            Text("\(value)")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(tint)
                .contentTransition(.numericText())
        }
    }

    // MARK: - Badges

    private var badgesCard: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    SectionLabel(text: "Badges")
                    Text("\(earnedBadges.count)/\(BadgeCatalog.all.count)")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(AppTheme.primary)
                }

                LazyVGrid(columns: Array(repeating: GridItem(spacing: 10), count: 3), spacing: 10) {
                    ForEach(BadgeCatalog.all) { badge in
                        BadgeTile(badge: badge, isEarned: user.badges.contains(badge.id))
                    }
                }
            }
        }
    }

    private var logoutButton: some View {
        Button {
            showLogoutConfirm = true
        } label: {
            Label("Log Out", systemImage: "rectangle.portrait.and.arrow.right")
                .font(.body.weight(.semibold))
                .frame(maxWidth: .infinity)
                .frame(minHeight: 48)
                .foregroundStyle(AppTheme.error)
                .background(AppTheme.error.opacity(0.12), in: .rect(cornerRadius: 14))
        }
        .buttonStyle(.pressable)
        .padding(.top, 4)
    }
}
