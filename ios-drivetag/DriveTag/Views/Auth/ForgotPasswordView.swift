import SwiftUI

/// Two-step reset: confirm the email exists, then set a new password.
struct ForgotPasswordView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss

    private enum Step { case verifyEmail, setPassword, done }

    @State private var step: Step = .verifyEmail
    @State private var email: String = ""
    @State private var newPassword: String = ""
    @State private var confirmPassword: String = ""
    @State private var errorMessage: String?
    @State private var isSubmitting: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(spacing: 10) {
                    Image(systemName: step == .done ? "checkmark.seal.fill" : "key.horizontal.fill")
                        .font(.system(size: 40))
                        .foregroundStyle(step == .done ? AppTheme.success : AppTheme.primary)
                    Text(title)
                        .font(.title2.weight(.bold))
                        .multilineTextAlignment(.center)
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 12)

                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                switch step {
                case .verifyEmail:
                    LabeledField(
                        label: "Email",
                        placeholder: "Enter your account email",
                        text: $email,
                        keyboard: .emailAddress,
                        autocapitalization: .never,
                        contentType: .emailAddress
                    )
                    PrimaryButton(title: "Continue", systemImage: "arrow.right", isLoading: isSubmitting) {
                        verifyEmail()
                    }

                case .setPassword:
                    LabeledField(
                        label: "New Password",
                        placeholder: "At least 6 characters",
                        text: $newPassword,
                        isSecure: true,
                        autocapitalization: .never,
                        contentType: .newPassword
                    )
                    LabeledField(
                        label: "Confirm Password",
                        placeholder: "Re-enter your new password",
                        text: $confirmPassword,
                        isSecure: true,
                        autocapitalization: .never,
                        contentType: .newPassword
                    )
                    PrimaryButton(title: "Reset Password", systemImage: "checkmark", isLoading: isSubmitting) {
                        resetPassword()
                    }

                case .done:
                    PrimaryButton(title: "Back to Login", systemImage: "arrow.left", tint: AppTheme.success) {
                        dismiss()
                    }
                }
            }
            .padding(20)
        }
        .background(Color.appBackground)
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle("Reset Password")
        .navigationBarTitleDisplayMode(.inline)
        .animation(.smooth, value: step)
    }

    private var title: String {
        switch step {
        case .verifyEmail: return "Forgot your password?"
        case .setPassword: return "Choose a new password"
        case .done: return "Password updated"
        }
    }

    private var subtitle: String {
        switch step {
        case .verifyEmail: return "Enter the email on your DriveTag account and we'll help you set a new password."
        case .setPassword: return "Pick something you'll remember for \(email.lowercased())."
        case .done: return "You can now log in with your new password."
        }
    }

    private func verifyEmail() {
        errorMessage = nil
        isSubmitting = true
        Task {
            do {
                try await auth.verifyEmailExists(email)
                step = .setPassword
            } catch {
                errorMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }

    private func resetPassword() {
        errorMessage = nil
        isSubmitting = true
        Task {
            do {
                try await auth.resetPassword(email: email, newPassword: newPassword, confirm: confirmPassword)
                step = .done
            } catch {
                errorMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }
}
