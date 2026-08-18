import SwiftUI

/// Five-slot tab bar with a raised center "Tag Driver" action, mirroring the RN layout.
struct MainTabView: View {
    @Environment(AuthStore.self) private var auth

    @State private var selection: Tab = .profile
    @State private var showTagDriver: Bool = false

    enum Tab: Hashable {
        case profile, leaderboard, games, shop
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selection) {
                ProfileView()
                    .tag(Tab.profile)
                    .tabItem { Label("Profile", systemImage: "person.fill") }

                LeaderboardView()
                    .tag(Tab.leaderboard)
                    .tabItem { Label("Leaderboard", systemImage: "trophy.fill") }

                GamesView()
                    .tag(Tab.games)
                    .tabItem { Label("Let's Play", systemImage: "play.fill") }

                ShopView()
                    .tag(Tab.shop)
                    .tabItem { Label("Shop", systemImage: "cart.fill") }
            }

            tagDriverButton
        }
        .sheet(isPresented: $showTagDriver) {
            TagDriverView()
        }
    }

    /// Floating center button that opens the tagging flow as a sheet.
    private var tagDriverButton: some View {
        Button {
            showTagDriver = true
        } label: {
            ZStack {
                Circle()
                    .fill(AppTheme.primary)
                    .frame(width: 62, height: 62)
                    .shadow(color: AppTheme.primary.opacity(0.45), radius: 10, y: 5)
                Image(systemName: "target")
                    .font(.system(size: 27, weight: .bold))
                    .foregroundStyle(.white)
            }
        }
        .buttonStyle(.pressable)
        .accessibilityLabel("Tag a driver")
        .offset(y: -26)
    }
}
