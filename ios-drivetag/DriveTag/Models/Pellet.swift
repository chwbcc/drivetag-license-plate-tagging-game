import Foundation

nonisolated enum PelletType: String, Codable, CaseIterable, Sendable {
    case negative
    case positive

    var label: String { self == .positive ? "Positive" : "Negative" }
    var verb: String { self == .positive ? "praised" : "tagged" }
}

nonisolated struct Pellet: Codable, Identifiable, Sendable {
    var id: String
    var licensePlate: String
    var targetUserID: String?
    var createdBy: String
    var createdAt: Double
    var notes: String
    var type: PelletType
    var latitude: Double?
    var longitude: Double?

    var date: Date { Date(timeIntervalSince1970: createdAt / 1000) }
}

/// Row shape for the Supabase `pellets` table.
nonisolated struct PelletRow: Codable, Sendable {
    var id: String
    var license_plate: String?
    var targetuserid: String?
    var created_by: String?
    var created_at: Double?
    var notes: String?
    var type: String?
    var latitude: Double?
    var longitude: Double?

    func toPellet() -> Pellet {
        Pellet(
            id: id,
            licensePlate: license_plate ?? "",
            targetUserID: targetuserid,
            createdBy: created_by ?? "",
            createdAt: created_at ?? 0,
            notes: notes ?? "",
            type: PelletType(rawValue: type ?? "negative") ?? .negative,
            latitude: latitude,
            longitude: longitude
        )
    }
}

/// Reason presets offered when tagging a driver.
nonisolated enum TagReasons {
    static let negative = [
        "Cutting off other drivers",
        "Not using turn signals",
        "Tailgating",
        "Speeding",
        "Illegal parking",
        "Blocking traffic",
        "Running red light",
        "Texting while driving",
        "Other",
    ]

    static let positive = [
        "Letting me merge",
        "Yielding right of way",
        "Courteous driving",
        "Helping in traffic",
        "Following rules",
        "Safe driving",
        "Proper signaling",
        "Patient driving",
        "Other",
    ]

    static func list(for type: PelletType) -> [String] {
        type == .positive ? positive : negative
    }
}

nonisolated enum USStates {
    static let all = [
        "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
        "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
        "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
        "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
        "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
        "DC",
    ]
}
