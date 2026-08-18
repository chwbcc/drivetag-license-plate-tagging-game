import Foundation
import Observation

/// Errors surfaced to the auth UI with copy the user can act on.
nonisolated enum AuthError: LocalizedError {
    case invalidEmail
    case emailTaken
    case userNotFound
    case wrongPassword
    case noPasswordSet
    case weakPassword
    case passwordMismatch
    case missingFields
    case invalidPlate
    case missingState

    var errorDescription: String? {
        switch self {
        case .invalidEmail: return "Please enter a valid email address (e.g., example@email.com)"
        case .emailTaken: return "An account with this email already exists"
        case .userNotFound: return "No account found with that email"
        case .wrongPassword: return "Incorrect password"
        case .noPasswordSet: return "This account has no password yet. Use Forgot Password to set one."
        case .weakPassword: return "Password must be at least 6 characters"
        case .passwordMismatch: return "Passwords do not match"
        case .missingFields: return "Please fill in all required fields"
        case .invalidPlate: return "Please enter a valid license plate number"
        case .missingState: return "Please select a state for your license plate"
        }
    }
}

/// Owns the signed-in user, persistence, and every auth mutation.
@Observable
final class AuthStore {
    private static let superAdminEmail = "chwbcc@gmail.com"
    private static let storageKey = "drivetag.currentUser"

    var user: AppUser?
    var isRefreshing: Bool = false

    private let users = UserService.shared
    private let defaults = UserDefaults.standard

    var isSignedIn: Bool { user != nil }

    init() {
        restore()
    }

    // MARK: - Persistence

    private func restore() {
        guard let data = defaults.data(forKey: Self.storageKey),
              let stored = try? JSONDecoder().decode(AppUser.self, from: data) else { return }
        user = applyRoleRules(to: stored)
    }

    private func persist() {
        guard let user, let data = try? JSONEncoder().encode(user) else {
            defaults.removeObject(forKey: Self.storageKey)
            return
        }
        defaults.set(data, forKey: Self.storageKey)
    }

    /// The seeded super admin keeps its role regardless of what the row says.
    private func applyRoleRules(to candidate: AppUser) -> AppUser {
        var updated = candidate
        if candidate.email.lowercased() == Self.superAdminEmail.lowercased() {
            updated.adminRole = .superAdmin
        }
        return updated
    }

    private func setUser(_ newValue: AppUser?) {
        user = newValue.map(applyRoleRules(to:))
        persist()
    }

    // MARK: - Session

    func signIn(email: String, password: String) async throws {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !password.isEmpty else { throw AuthError.missingFields }
        guard Self.isValidEmail(trimmed) else { throw AuthError.invalidEmail }

        guard let row = try await users.fetchRow(email: trimmed) else { throw AuthError.userNotFound }
        guard let storedHash = row.passwordhash, !storedHash.isEmpty else { throw AuthError.noPasswordSet }
        guard storedHash == Hashing.hashPassword(password) else { throw AuthError.wrongPassword }

        setUser(row.toUser())
    }

    func register(
        name: String,
        email: String,
        password: String,
        confirmPassword: String,
        plate: String,
        state: String
    ) async throws {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedPlate = plate.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedState = state.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedEmail.isEmpty, !trimmedPlate.isEmpty, !password.isEmpty else { throw AuthError.missingFields }
        guard password.count >= 6 else { throw AuthError.weakPassword }
        guard password == confirmPassword else { throw AuthError.passwordMismatch }
        guard Self.isValidEmail(trimmedEmail) else { throw AuthError.invalidEmail }
        guard (3...8).contains(trimmedPlate.count) else { throw AuthError.invalidPlate }
        guard !trimmedState.isEmpty else { throw AuthError.missingState }

        if try await users.fetchRow(email: trimmedEmail) != nil { throw AuthError.emailTaken }

        let payload = NewUserPayload(
            id: IDGenerator.user(),
            email: trimmedEmail,
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            plate: trimmedPlate,
            state: trimmedState,
            passwordHash: Hashing.hashPassword(password)
        )

        let created = try await users.createUser(payload)
        setUser(created ?? AppUser(
            id: payload.id, email: payload.email, name: payload.name, photo: nil,
            licensePlate: payload.license_plate, state: payload.state,
            pelletCount: 10, positivePelletCount: 5, positiveRatingCount: 0,
            negativeRatingCount: 0, pelletsGivenCount: 0, positivePelletsGivenCount: 0,
            negativePelletsGivenCount: 0, badges: [], exp: 0, level: 1, adminRole: nil
        ))
    }

    func signOut() {
        setUser(nil)
    }

    /// Pulls the freshest row so stats stay in sync with other devices.
    func refresh() async {
        guard let id = user?.id else { return }
        isRefreshing = true
        defer { isRefreshing = false }
        do {
            if let fresh = try await users.fetchUser(id: id) {
                setUser(fresh)
            }
        } catch {
            // Offline is expected on the road — keep showing the cached profile.
        }
    }

    /// Applies local edits immediately, then mirrors them to the database.
    func applyLocal(_ transform: (inout AppUser) -> Void) {
        guard var current = user else { return }
        transform(&current)
        setUser(current)
    }

    // MARK: - Password management

    func changePassword(current: String, newPassword: String, confirm: String) async throws {
        guard let user else { throw AuthError.userNotFound }
        guard newPassword.count >= 6 else { throw AuthError.weakPassword }
        guard newPassword == confirm else { throw AuthError.passwordMismatch }

        guard let row = try await users.fetchRow(email: user.email) else { throw AuthError.userNotFound }
        guard let hash = row.passwordhash, hash == Hashing.hashPassword(current) else { throw AuthError.wrongPassword }

        try await users.updatePassword(id: user.id, newPassword: newPassword)
    }

    /// Resets a password by email — the "forgot password" path.
    func resetPassword(email: String, newPassword: String, confirm: String) async throws {
        guard newPassword.count >= 6 else { throw AuthError.weakPassword }
        guard newPassword == confirm else { throw AuthError.passwordMismatch }
        guard let row = try await users.fetchRow(email: email) else { throw AuthError.userNotFound }
        try await users.updatePassword(id: row.id, newPassword: newPassword)
    }

    func verifyEmailExists(_ email: String) async throws {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard Self.isValidEmail(trimmed) else { throw AuthError.invalidEmail }
        guard try await users.fetchRow(email: trimmed) != nil else { throw AuthError.userNotFound }
    }

    // MARK: - Profile

    func saveProfile(name: String, plate: String, state: String, photo: String?) async throws {
        guard let user else { throw AuthError.userNotFound }
        let trimmedPlate = plate.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard (3...8).contains(trimmedPlate.count) else { throw AuthError.invalidPlate }

        var values: [String: JSONValue] = [
            "name": .string(name),
            "username": .string(name),
            "license_plate": .string(trimmedPlate),
            "state": .string(state),
        ]
        values["photo"] = photo.map { JSONValue.string($0) } ?? .null

        try await users.update(id: user.id, values: values)
        applyLocal {
            $0.name = name
            $0.licensePlate = trimmedPlate
            $0.state = state
            $0.photo = photo
        }
    }

    // MARK: - Badges

    /// Evaluates badge criteria and writes any newly earned badges. Returns the new IDs.
    @discardableResult
    func awardBadges(counts: BadgeCounts) async -> [String] {
        guard let user else { return [] }
        let earned = BadgeCatalog.newlyEarned(counts: counts, owned: user.badges)
        guard !earned.isEmpty else { return [] }

        let merged = Array(Set(user.badges + earned)).sorted()
        applyLocal { $0.badges = merged }
        try? await users.setBadges(id: user.id, badges: merged)
        return earned
    }

    // MARK: - Helpers

    static func isValidEmail(_ email: String) -> Bool {
        let pattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
        return email.range(of: pattern, options: .regularExpression) != nil
    }
}
