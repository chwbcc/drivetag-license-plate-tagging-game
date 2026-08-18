import SwiftUI

struct RegisterView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var confirmPassword: String = ""
    @State private var plate: String = ""
    @State private var state: String = ""
    @State private var errorMessage: String?
    @State private var isSubmitting: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(spacing: 8) {
                    Text("🎯").font(.system(size: 44))
                    Text("Create Account")
                        .font(.title.weight(.bold))
                    Text("Join the community of responsible drivers")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 8)

                VStack(spacing: 14) {
                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    LabeledField(label: "Name", placeholder: "Enter your name", text: $name, contentType: .name)

                    LabeledField(
                        label: "Email *",
                        placeholder: "Enter your email",
                        text: $email,
                        keyboard: .emailAddress,
                        autocapitalization: .never,
                        contentType: .emailAddress
                    )

                    LabeledField(
                        label: "Password *",
                        placeholder: "Create a password (min 6 characters)",
                        text: $password,
                        isSecure: true,
                        autocapitalization: .never,
                        contentType: .newPassword
                    )

                    LabeledField(
                        label: "Confirm Password *",
                        placeholder: "Re-enter your password",
                        text: $confirmPassword,
                        isSecure: true,
                        autocapitalization: .never,
                        contentType: .newPassword
                    )

                    LabeledField(
                        label: "License Plate *",
                        placeholder: "Enter your license plate",
                        text: $plate,
                        autocapitalization: .characters
                    )
                    .onChange(of: plate) { _, newValue in
                        plate = newValue.uppercased()
                    }

                    statePicker
                }

                PrimaryButton(title: "Create Account", systemImage: "checkmark.circle.fill", isLoading: isSubmitting) {
                    submit()
                }

                CardContainer {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("Starter pellets included", systemImage: "gift.fill")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(AppTheme.success)
                        Text("New users get 10 negative pellets and 5 positive pellets to start tagging.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            .padding(20)
        }
        .background(Color.appBackground)
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle("Sign Up")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var statePicker: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("State *")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)

            Menu {
                Picker("State", selection: $state) {
                    Text("Select a state").tag("")
                    ForEach(USStates.all, id: \.self) { code in
                        Text(code).tag(code)
                    }
                }
            } label: {
                HStack {
                    Text(state.isEmpty ? "Select a state" : state)
                        .foregroundStyle(state.isEmpty ? .secondary : .primary)
                    Spacer()
                    Image(systemName: "chevron.up.chevron.down")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 14)
                .frame(minHeight: 50)
                .background(Color.appCard, in: .rect(cornerRadius: 12))
                .overlay {
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.primary.opacity(0.08), lineWidth: 1)
                }
            }
        }
    }

    private func submit() {
        errorMessage = nil
        isSubmitting = true
        Task {
            do {
                try await auth.register(
                    name: name,
                    email: email,
                    password: password,
                    confirmPassword: confirmPassword,
                    plate: plate,
                    state: state
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }
}
