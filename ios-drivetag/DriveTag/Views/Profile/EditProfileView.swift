import PhotosUI
import SwiftUI

struct EditProfileView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var plate: String = ""
    @State private var state: String = ""
    @State private var photoURL: String = ""

    @State private var currentPassword: String = ""
    @State private var newPassword: String = ""
    @State private var confirmPassword: String = ""

    @State private var isSavingProfile: Bool = false
    @State private var isSavingPassword: Bool = false
    @State private var profileError: String?
    @State private var passwordError: String?
    @State private var successMessage: String?

    private var user: AppUser { auth.user ?? .placeholder }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                profileSection
                passwordSection
                accountSection
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear(perform: loadCurrentValues)
        .alert("Saved", isPresented: .constant(successMessage != nil)) {
            Button("OK") { successMessage = nil }
        } message: {
            Text(successMessage ?? "")
        }
    }

    // MARK: - Profile

    private var profileSection: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 14) {
                SectionLabel(text: "Profile")

                if let profileError {
                    ErrorBanner(message: profileError)
                }

                LabeledField(label: "Name", placeholder: "Your display name", text: $name, contentType: .name)

                LabeledField(
                    label: "License Plate",
                    placeholder: "ABC1234",
                    text: $plate,
                    autocapitalization: .characters
                )
                .onChange(of: plate) { _, newValue in
                    plate = String(newValue.uppercased().prefix(8))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("State")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.secondary)
                    Menu {
                        Picker("State", selection: $state) {
                            Text("Select a state").tag("")
                            ForEach(USStates.all, id: \.self) { Text($0).tag($0) }
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
                        .background(Color.appBackground, in: .rect(cornerRadius: 12))
                    }
                }

                LabeledField(
                    label: "Photo URL (optional)",
                    placeholder: "https://…",
                    text: $photoURL,
                    keyboard: .URL,
                    autocapitalization: .never
                )

                HStack {
                    Text("Preview")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    PlateBadge(state: state, number: plate)
                }

                PrimaryButton(title: "Save Profile", systemImage: "checkmark", isLoading: isSavingProfile) {
                    saveProfile()
                }
            }
        }
    }

    // MARK: - Password

    private var passwordSection: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 14) {
                SectionLabel(text: "Change Password")

                if let passwordError {
                    ErrorBanner(message: passwordError)
                }

                LabeledField(
                    label: "Current Password",
                    placeholder: "Enter current password",
                    text: $currentPassword,
                    isSecure: true,
                    autocapitalization: .never,
                    contentType: .password
                )

                LabeledField(
                    label: "New Password",
                    placeholder: "At least 6 characters",
                    text: $newPassword,
                    isSecure: true,
                    autocapitalization: .never,
                    contentType: .newPassword
                )

                LabeledField(
                    label: "Confirm New Password",
                    placeholder: "Re-enter new password",
                    text: $confirmPassword,
                    isSecure: true,
                    autocapitalization: .never,
                    contentType: .newPassword
                )

                PrimaryButton(
                    title: "Update Password",
                    systemImage: "lock.rotation",
                    tint: AppTheme.secondary,
                    isLoading: isSavingPassword
                ) {
                    savePassword()
                }
            }
        }
    }

    // MARK: - Account info

    private var accountSection: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 10) {
                SectionLabel(text: "Account")
                infoRow("Email", value: user.email)
                infoRow("Member level", value: "Level \(user.level)")
                if let role = user.adminRole {
                    infoRow("Role", value: role.label)
                }
            }
        }
    }

    private func infoRow(_ label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Text(value)
                .font(.subheadline.weight(.medium))
                .lineLimit(1)
        }
    }

    // MARK: - Actions

    private func loadCurrentValues() {
        name = user.name
        plate = user.licensePlate
        state = user.state
        photoURL = user.photo ?? ""
    }

    private func saveProfile() {
        profileError = nil
        isSavingProfile = true
        Task {
            do {
                let trimmedPhoto = photoURL.trimmingCharacters(in: .whitespacesAndNewlines)
                try await auth.saveProfile(
                    name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                    plate: plate,
                    state: state,
                    photo: trimmedPhoto.isEmpty ? nil : trimmedPhoto
                )
                successMessage = "Your profile has been updated."
            } catch {
                profileError = error.localizedDescription
            }
            isSavingProfile = false
        }
    }

    private func savePassword() {
        passwordError = nil
        isSavingPassword = true
        Task {
            do {
                try await auth.changePassword(
                    current: currentPassword,
                    newPassword: newPassword,
                    confirm: confirmPassword
                )
                currentPassword = ""
                newPassword = ""
                confirmPassword = ""
                successMessage = "Your password has been changed."
            } catch {
                passwordError = error.localizedDescription
            }
            isSavingPassword = false
        }
    }
}
