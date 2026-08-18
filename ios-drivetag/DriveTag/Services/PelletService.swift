import Foundation

/// Database reads/writes for the `pellets` table.
nonisolated struct PelletService: Sendable {
    static let shared = PelletService()
    private let db = SupabaseService.shared

    func fetchAll(limit: Int = 1000) async throws -> [Pellet] {
        let rows = try await db.select(
            PelletRow.self,
            from: "pellets",
            query: [
                URLQueryItem(name: "order", value: "created_at.desc"),
                URLQueryItem(name: "limit", value: "\(limit)"),
            ]
        )
        return rows.map { $0.toPellet() }
    }

    func fetch(type: PelletType?, limit: Int = 1000) async throws -> [Pellet] {
        var query = [
            URLQueryItem(name: "order", value: "created_at.desc"),
            URLQueryItem(name: "limit", value: "\(limit)"),
        ]
        if let type {
            query.append(URLQueryItem(name: "type", value: "eq.\(type.rawValue)"))
        }
        let rows = try await db.select(PelletRow.self, from: "pellets", query: query)
        return rows.map { $0.toPellet() }
    }

    /// Tags received by a given plate.
    func fetchReceived(plate: String) async throws -> [Pellet] {
        let rows = try await db.select(
            PelletRow.self,
            from: "pellets",
            query: [
                URLQueryItem(name: "license_plate", value: "ilike.\(plate)"),
                URLQueryItem(name: "order", value: "created_at.desc"),
            ]
        )
        return rows.map { $0.toPellet() }
    }

    func fetchCreated(by userID: String) async throws -> [Pellet] {
        let rows = try await db.select(
            PelletRow.self,
            from: "pellets",
            query: [
                URLQueryItem(name: "created_by", value: "eq.\(userID)"),
                URLQueryItem(name: "order", value: "created_at.desc"),
            ]
        )
        return rows.map { $0.toPellet() }
    }

    func create(_ payload: NewPelletPayload) async throws {
        try await db.insert(payload, into: "pellets")
    }

    func delete(id: String) async throws {
        try await db.delete(table: "pellets", matching: [URLQueryItem(name: "id", value: "eq.\(id)")])
    }

    /// Removes every tag pointing at a plate — powers the "erase record" shop item.
    func erase(plate: String) async throws {
        try await db.delete(
            table: "pellets",
            matching: [URLQueryItem(name: "license_plate", value: "ilike.\(plate)")]
        )
    }
}

nonisolated struct NewPelletPayload: Encodable, Sendable {
    var id: String
    var license_plate: String
    var targetuserid: String?
    var created_by: String
    var created_at: Double
    var notes: String
    var type: String
    var latitude: Double?
    var longitude: Double?
}
