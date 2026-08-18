import Foundation

/// Database reads/writes for the `users` table.
nonisolated struct UserService: Sendable {
    static let shared = UserService()
    private let db = SupabaseService.shared

    // MARK: - Lookups

    func fetchUser(id: String) async throws -> AppUser? {
        let rows = try await db.select(
            UserRow.self,
            from: "users",
            query: [URLQueryItem(name: "id", value: "eq.\(id)"), URLQueryItem(name: "limit", value: "1")]
        )
        return rows.first?.toUser()
    }

    func fetchRow(email: String) async throws -> UserRow? {
        let normalized = email.lowercased()
        let rows = try await db.select(
            UserRow.self,
            from: "users",
            query: [URLQueryItem(name: "email", value: "eq.\(normalized)"), URLQueryItem(name: "limit", value: "1")]
        )
        return rows.first
    }

    /// Finds the registered owner of a plate, if any. Used to credit tags to real accounts.
    func fetchUserID(plate: String) async throws -> String? {
        let rows = try await db.select(
            UserRow.self,
            from: "users",
            query: [
                URLQueryItem(name: "license_plate", value: "ilike.\(plate)"),
                URLQueryItem(name: "limit", value: "1"),
            ]
        )
        return rows.first?.id
    }

    func fetchAllUsers(limit: Int = 500) async throws -> [AppUser] {
        let rows = try await db.select(
            UserRow.self,
            from: "users",
            query: [URLQueryItem(name: "limit", value: "\(limit)")]
        )
        return rows.map { $0.toUser() }
    }

    func fetchExperienceLeaderboard(ascending: Bool) async throws -> [AppUser] {
        let rows = try await db.select(
            UserRow.self,
            from: "users",
            query: [
                URLQueryItem(name: "select", value: "id,name,username,experience,level"),
                URLQueryItem(name: "order", value: "experience.\(ascending ? "asc" : "desc")"),
                URLQueryItem(name: "limit", value: "100"),
            ]
        )
        return rows.map { $0.toUser() }
    }

    // MARK: - Writes

    func createUser(_ payload: NewUserPayload) async throws -> AppUser? {
        try await db.insert(payload, into: "users", returning: UserRow.self)?.toUser()
    }

    func update(id: String, values: [String: JSONValue]) async throws {
        try await db.update(
            table: "users",
            matching: [URLQueryItem(name: "id", value: "eq.\(id)")],
            values: values
        )
    }

    func updatePassword(id: String, newPassword: String) async throws {
        try await update(id: id, values: ["passwordhash": .string(Hashing.hashPassword(newPassword))])
    }

    func setBadges(id: String, badges: [String]) async throws {
        let json = String(data: try JSONEncoder().encode(badges), encoding: .utf8) ?? "[]"
        try await update(id: id, values: ["badges": .string(json)])
    }

    func incrementRating(userID: String, type: PelletType) async throws {
        guard let user = try await fetchUser(id: userID) else { return }
        let column = type == .positive ? "positive_rating_count" : "negative_rating_count"
        let current = type == .positive ? user.positiveRatingCount : user.negativeRatingCount
        try await update(id: userID, values: [column: .int(current + 1)])
    }

    func delete(id: String) async throws {
        try await db.delete(table: "users", matching: [URLQueryItem(name: "id", value: "eq.\(id)")])
    }
}

/// Insert payload for a brand-new account, matching the snake_case schema.
nonisolated struct NewUserPayload: Encodable, Sendable {
    var id: String
    var email: String
    var username: String
    var name: String
    var created_at: Double
    var role: String
    var license_plate: String
    var state: String
    var experience: Int
    var level: Int
    var negative_pellet_count: Int
    var positive_pellet_count: Int
    var positive_rating_count: Int
    var negative_rating_count: Int
    var pellets_given_count: Int
    var positive_pellets_given_count: Int
    var negative_pellets_given_count: Int
    var badges: String
    var passwordhash: String

    init(id: String, email: String, name: String, plate: String, state: String, passwordHash: String) {
        self.id = id
        self.email = email.lowercased()
        self.username = name.isEmpty ? "Anonymous" : name
        self.name = name.isEmpty ? "Anonymous" : name
        created_at = Date().timeIntervalSince1970 * 1000
        role = "user"
        license_plate = plate.uppercased()
        self.state = state
        experience = 0
        level = 1
        negative_pellet_count = 10
        positive_pellet_count = 5
        positive_rating_count = 0
        negative_rating_count = 0
        pellets_given_count = 0
        positive_pellets_given_count = 0
        negative_pellets_given_count = 0
        badges = "[]"
        passwordhash = passwordHash
    }
}
