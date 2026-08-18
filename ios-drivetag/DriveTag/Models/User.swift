import Foundation

/// Admin access levels, mirroring the web app's `AdminRole` union.
nonisolated enum AdminRole: String, Codable, CaseIterable, Sendable {
    case superAdmin = "super_admin"
    case admin
    case moderator
    case analyst

    var label: String {
        switch self {
        case .superAdmin: return "Super Admin"
        case .admin: return "Admin"
        case .moderator: return "Moderator"
        case .analyst: return "Analyst"
        }
    }

    /// Analysts only reach the analytics dashboard, not the admin console.
    var canOpenAdminConsole: Bool { self != .analyst }
    var canOpenAnalytics: Bool { true }
}

nonisolated struct AppUser: Codable, Identifiable, Sendable, Equatable {
    var id: String
    var email: String
    var name: String
    var photo: String?
    var licensePlate: String
    var state: String
    var pelletCount: Int
    var positivePelletCount: Int
    var positiveRatingCount: Int
    var negativeRatingCount: Int
    var pelletsGivenCount: Int
    var positivePelletsGivenCount: Int
    var negativePelletsGivenCount: Int
    var badges: [String]
    var exp: Int
    var level: Int
    var adminRole: AdminRole?

    var displayName: String { name.isEmpty ? "Anonymous Driver" : name }

    var totalReceived: Int { positiveRatingCount + negativeRatingCount }

    /// Plate formatted with its state prefix, e.g. `CA-7ABC123`.
    var fullPlate: String {
        guard !licensePlate.isEmpty else { return "" }
        if licensePlate.contains("-") || state.isEmpty { return licensePlate }
        return "\(state)-\(licensePlate)"
    }

    static let placeholder = AppUser(
        id: "", email: "", name: "", photo: nil, licensePlate: "", state: "",
        pelletCount: 0, positivePelletCount: 0, positiveRatingCount: 0,
        negativeRatingCount: 0, pelletsGivenCount: 0, positivePelletsGivenCount: 0,
        negativePelletsGivenCount: 0, badges: [], exp: 0, level: 1, adminRole: nil
    )
}

/// Row shape returned by the Supabase `users` table (snake_case columns).
nonisolated struct UserRow: Codable, Sendable {
    var id: String
    var email: String?
    var name: String?
    var username: String?
    var photo: String?
    var license_plate: String?
    var state: String?
    var role: String?
    var experience: Int?
    var level: Int?
    var negative_pellet_count: Int?
    var positive_pellet_count: Int?
    var positive_rating_count: Int?
    var negative_rating_count: Int?
    var pellets_given_count: Int?
    var positive_pellets_given_count: Int?
    var negative_pellets_given_count: Int?
    var badges: String?
    var passwordhash: String?

    func toUser() -> AppUser {
        let parsedBadges: [String] = {
            guard let badges, let data = badges.data(using: .utf8) else { return [] }
            return (try? JSONDecoder().decode([String].self, from: data)) ?? []
        }()

        return AppUser(
            id: id,
            email: email ?? "",
            name: name ?? username ?? "",
            photo: photo,
            licensePlate: license_plate ?? "",
            state: state ?? "",
            pelletCount: negative_pellet_count ?? 0,
            positivePelletCount: positive_pellet_count ?? 0,
            positiveRatingCount: positive_rating_count ?? 0,
            negativeRatingCount: negative_rating_count ?? 0,
            pelletsGivenCount: pellets_given_count ?? 0,
            positivePelletsGivenCount: positive_pellets_given_count ?? 0,
            negativePelletsGivenCount: negative_pellets_given_count ?? 0,
            badges: parsedBadges,
            exp: experience ?? 0,
            level: level ?? 1,
            adminRole: AdminRole(rawValue: role ?? "user")
        )
    }
}
