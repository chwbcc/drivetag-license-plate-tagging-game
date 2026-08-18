import SwiftUI

/// Moderation console: browse users, adjust roles/pellets, and review recent tags.
struct AdminConsoleView: View {
    @Environment(AuthStore.self) private var auth

    private enum Tab: Hashable { case users, tags }

    @State private var tab: Tab = .users
    @State private var users: [AppUser] = []
    @State private var pellets: [Pellet] = []
    @State private var searchText: String = ""
    @State private var isLoading: Bool = true
    @State private var errorMessage: String?
    @State private var selectedUser: AppUser?

    private var isSuperAdmin: Bool { auth.user?.adminRole == .superAdmin }

    private var filteredUsers: [AppUser] {
        guard !searchText.isEmpty else { return users }
        let needle = searchText.lowercased()
        return users.filter {
            $0.email.lowercased().contains(needle)
                || $0.name.lowercased().contains(needle)
                || $0.licensePlate.lowercased().contains(needle)
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                if let errorMessage {
                    ErrorBanner(message: errorMessage)
                }

                summaryRow

                ChipPicker(
                    options: [
                        (value: Tab.users, label: "Users", systemImage: "person.2.fill"),
                        (value: Tab.tags, label: "Recent Tags", systemImage: "tag.fill"),
                    ],
                    selection: $tab,
                    tint: AppTheme.adminGold
                )

                if isLoading {
                    ProgressView().padding(.vertical, 50)
                } else if tab == .users {
                    usersList
                } else {
                    tagsList
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Admin Console")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $searchText, prompt: "Search users")
        .refreshable { await load() }
        .task { await load() }
        .sheet(item: $selectedUser) { (user: AppUser) in
            AdminUserDetailSheet(
                user: user,
                canEditRoles: isSuperAdmin,
                onChanged: { await load() }
            )
        }
    }

    private var summaryRow: some View {
        HStack(spacing: 12) {
            summaryTile("\(users.count)", label: "Users", tint: AppTheme.primary)
            summaryTile("\(pellets.count)", label: "Tags", tint: AppTheme.secondary)
            summaryTile("\(users.filter { $0.adminRole != nil }.count)", label: "Staff", tint: AppTheme.adminGold)
        }
    }

    private func summaryTile(_ value: String, label: String, tint: Color) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(tint)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(Color.appCard, in: .rect(cornerRadius: 12))
    }

    private var usersList: some View {
        VStack(spacing: 8) {
            if filteredUsers.isEmpty {
                EmptyStateView(
                    systemImage: "person.slash",
                    title: "No users found",
                    message: searchText.isEmpty ? "No accounts have been created yet." : "Try a different search."
                )
            } else {
                ForEach(filteredUsers) { user in
                    Button {
                        selectedUser = user
                    } label: {
                        HStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(AppTheme.primary.opacity(0.15))
                                    .frame(width: 38, height: 38)
                                Text(String(user.displayName.prefix(1)).uppercased())
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(AppTheme.primary)
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text(user.displayName)
                                        .font(.subheadline.weight(.semibold))
                                        .lineLimit(1)
                                    if let role = user.adminRole {
                                        Text(role.label)
                                            .font(.system(size: 9, weight: .bold))
                                            .padding(.horizontal, 5)
                                            .padding(.vertical, 2)
                                            .background(AppTheme.adminGold.opacity(0.2), in: .capsule)
                                            .foregroundStyle(AppTheme.adminGold)
                                    }
                                }
                                Text(user.email)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }

                            Spacer(minLength: 0)

                            VStack(alignment: .trailing, spacing: 2) {
                                Text("Lv \(user.level)")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(AppTheme.accentYellow)
                                Text("\(user.pelletCount)/\(user.positivePelletCount)")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }

                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding(12)
                        .background(Color.appCard, in: .rect(cornerRadius: 12))
                    }
                    .buttonStyle(.pressable)
                }
            }
        }
    }

    private var tagsList: some View {
        VStack(spacing: 8) {
            if pellets.isEmpty {
                EmptyStateView(systemImage: "tag.slash", title: "No tags yet", message: "Tags will appear here as drivers get reported.")
            } else {
                ForEach(pellets.prefix(60)) { pellet in
                    HStack(spacing: 12) {
                        Image(systemName: pellet.type == .positive ? "hand.thumbsup.fill" : "hand.thumbsdown.fill")
                            .font(.caption)
                            .foregroundStyle(pellet.type == .positive ? AppTheme.success : AppTheme.error)
                            .frame(width: 32, height: 32)
                            .background(
                                (pellet.type == .positive ? AppTheme.success : AppTheme.error).opacity(0.14),
                                in: .rect(cornerRadius: 9)
                            )

                        VStack(alignment: .leading, spacing: 2) {
                            Text(pellet.licensePlate)
                                .font(.subheadline.weight(.semibold))
                                .monospaced()
                            Text(pellet.notes.isEmpty ? "No reason given" : pellet.notes)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }

                        Spacer(minLength: 0)

                        VStack(alignment: .trailing, spacing: 2) {
                            Text(pellet.date, format: .dateTime.month(.abbreviated).day())
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            if pellet.latitude != nil {
                                Image(systemName: "location.fill")
                                    .font(.system(size: 9))
                                    .foregroundStyle(AppTheme.primary)
                            }
                        }

                        if isSuperAdmin {
                            Button {
                                remove(pellet)
                            } label: {
                                Image(systemName: "trash")
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.error)
                            }
                            .buttonStyle(.borderless)
                        }
                    }
                    .padding(12)
                    .background(Color.appCard, in: .rect(cornerRadius: 12))
                }
            }
        }
    }

    // MARK: - Actions

    private func load() async {
        errorMessage = nil
        do {
            let fetchedUsers = try await UserService.shared.fetchAllUsers()
            let fetchedPellets = try await PelletService.shared.fetchAll()
            users = fetchedUsers
            pellets = fetchedPellets
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func remove(_ pellet: Pellet) {
        Task {
            do {
                try await PelletService.shared.delete(id: pellet.id)
                pellets.removeAll { $0.id == pellet.id }
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

/// Detail sheet for adjusting one account.
private struct AdminUserDetailSheet: View {
    let user: AppUser
    let canEditRoles: Bool
    let onChanged: () async -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var role: AdminRole?
    @State private var negativePellets: Int
    @State private var positivePellets: Int
    @State private var resetPassword: String = ""
    @State private var isSaving: Bool = false
    @State private var errorMessage: String?
    @State private var statusMessage: String?

    init(user: AppUser, canEditRoles: Bool, onChanged: @escaping () async -> Void) {
        self.user = user
        self.canEditRoles = canEditRoles
        self.onChanged = onChanged
        _role = State(initialValue: user.adminRole)
        _negativePellets = State(initialValue: user.pelletCount)
        _positivePellets = State(initialValue: user.positivePelletCount)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Account") {
                    LabeledContent("Name", value: user.displayName)
                    LabeledContent("Email", value: user.email)
                    LabeledContent("Plate", value: user.fullPlate.isEmpty ? "—" : user.fullPlate)
                    LabeledContent("Level", value: "\(user.level)")
                    LabeledContent("Experience", value: "\(user.exp)")
                }

                Section("Record") {
                    LabeledContent("Positive received", value: "\(user.positiveRatingCount)")
                    LabeledContent("Negative received", value: "\(user.negativeRatingCount)")
                    LabeledContent("Tags given", value: "\(user.pelletsGivenCount)")
                }

                Section("Pellet Balance") {
                    Stepper("Negative: \(negativePellets)", value: $negativePellets, in: 0...999)
                    Stepper("Positive: \(positivePellets)", value: $positivePellets, in: 0...999)
                }

                if canEditRoles {
                    Section("Role") {
                        Picker("Role", selection: $role) {
                            Text("User").tag(AdminRole?.none)
                            ForEach(AdminRole.allCases, id: \.self) { option in
                                Text(option.label).tag(AdminRole?.some(option))
                            }
                        }
                    }

                    Section("Reset Password") {
                        SecureField("New password (min 6 chars)", text: $resetPassword)
                        Button("Set Password") { applyPasswordReset() }
                            .disabled(resetPassword.count < 6 || isSaving)
                    }
                }

                if let errorMessage {
                    Section { Text(errorMessage).foregroundStyle(AppTheme.error).font(.caption) }
                }
                if let statusMessage {
                    Section { Text(statusMessage).foregroundStyle(AppTheme.success).font(.caption) }
                }
            }
            .navigationTitle("Manage User")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(isSaving)
                }
            }
        }
    }

    private func save() {
        isSaving = true
        errorMessage = nil
        Task {
            do {
                var values: [String: JSONValue] = [
                    "negative_pellet_count": .int(negativePellets),
                    "positive_pellet_count": .int(positivePellets),
                ]
                if canEditRoles {
                    values["role"] = .string(role?.rawValue ?? "user")
                }
                try await UserService.shared.update(id: user.id, values: values)
                await onChanged()
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }

    private func applyPasswordReset() {
        isSaving = true
        errorMessage = nil
        statusMessage = nil
        Task {
            do {
                try await UserService.shared.updatePassword(id: user.id, newPassword: resetPassword)
                resetPassword = ""
                statusMessage = "Password updated."
            } catch {
                errorMessage = error.localizedDescription
            }
            isSaving = false
        }
    }
}
