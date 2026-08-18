import SwiftUI

struct LoginView: View {
    @Environment(AuthStore.self) private var auth

    @State private var email: String = ""
    @State private var password: String = ""
    @State private var errorMessage: String?
    @State private var isSubmitting: Bool = false
    @State private var showRegister: Bool = false
    @State private var showForgotPassword: Bool = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 22) {
                    header

                    VStack(spacing: 14) {
                        if let errorMessage {
                            ErrorBanner(message: errorMessage)
                        }

                        LabeledField(
                            label: "Email",
                            placeholder: "Enter your email",
                            text: $email,
                            keyboard: .emailAddress,
                            autocapitalization: .never,
                            contentType: .emailAddress
                        )

                        LabeledField(
                            label: "Password",
                            placeholder: "Enter your password",
                            text: $password,
                            isSecure: true,
                            autocapitalization: .never,
                            contentType: .password
                        )

                        Button("Forgot password?") { showForgotPassword = true }
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(AppTheme.primary)
                            .frame(maxWidth: .infinity, alignment: .trailing)

                        PrimaryButton(
                            title: "Login",
                            systemImage: "arrow.right.circle.fill",
                            isLoading: isSubmitting
                        ) {
                            submit()
                        }
                        .padding(.top, 4)
                    }

                    VStack(spacing: 12) {
                        Text("Don't have an account?")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        SecondaryButton(title: "Create Account", systemImage: "person.badge.plus") {
                            showRegister = true
                        }
                    }
                    .padding(.top, 8)

                    infoCard
                }
                .padding(20)
            }
            .background(Color.appBackground)
            .scrollDismissesKeyboard(.interactively)
            .navigationDestination(isPresented: $showRegister) { RegisterView() }
            .navigationDestination(isPresented: $showForgotPassword) { ForgotPasswordView() }
        }
    }

    private var header: some View {
        VStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [AppTheme.primary, AppTheme.secondary],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 86, height: 86)
                Image(systemName: "target")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundStyle(.white)
            }
            .shadow(color: AppTheme.primary.opacity(0.35), radius: 16, y: 8)

            Text("DriveTag")
                .font(.largeTitle.weight(.heavy))
            Text("Rate the drivers around you")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(.top, 32)
        .padding(.bottom, 8)
    }

    private var infoCard: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 6) {
                Label("Anonymous by design", systemImage: "lock.shield.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AppTheme.success)
                Text("License plates are hashed on the leaderboard so no one can be identified from public rankings.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.top, 12)
    }

    private func submit() {
        errorMessage = nil
        isSubmitting = true
        Task {
            do {
                try await auth.signIn(email: email, password: password)
            } catch {
                errorMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }
}
