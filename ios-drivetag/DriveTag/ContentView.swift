import SwiftUI

/// Routes between the auth flow and the signed-in tab shell.
struct ContentView: View {
    @State private var auth = AuthStore()
    @State private var games = GameProgressStore()

    var body: some View {
        Group {
            if auth.isSignedIn {
                MainTabView()
                    .transition(.opacity)
            } else {
                LoginView()
                    .transition(.opacity)
            }
        }
        .animation(.smooth(duration: 0.3), value: auth.isSignedIn)
        .environment(auth)
        .environment(games)
        .tint(AppTheme.primary)
    }
}

#Preview {
    ContentView()
}
