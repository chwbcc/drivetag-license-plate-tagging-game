import CoreLocation
import Foundation

/// Orchestrates the multi-step write that records a tag:
/// create the pellet, credit the target, then reward the tagger.
nonisolated enum TagSubmitter {
    struct Result: Sendable {
        var expGained: Int
        var newExp: Int
        var newLevel: Int
        var leveledUp: Bool
        var matchedRegisteredUser: Bool
    }

    static func submit(
        user: AppUser,
        fullPlate: String,
        reason: String,
        type: PelletType,
        coordinate: CLLocationCoordinate2D?
    ) async throws -> Result {
        let users = UserService.shared
        let pellets = PelletService.shared

        // Always work from the freshest counters so concurrent devices don't overwrite each other.
        let latest = (try? await users.fetchUser(id: user.id)) ?? user

        // Step 1 — does the plate belong to a registered account?
        let targetUserID = try? await users.fetchUserID(plate: fullPlate)

        // Step 2 — record the pellet.
        try await pellets.create(
            NewPelletPayload(
                id: IDGenerator.pellet(),
                license_plate: fullPlate,
                targetuserid: targetUserID,
                created_by: user.id,
                created_at: Date().timeIntervalSince1970 * 1000,
                notes: reason,
                type: type.rawValue,
                latitude: coordinate?.latitude,
                longitude: coordinate?.longitude
            )
        )

        // Step 3 — credit the tagged driver, if we know who they are.
        if let targetUserID {
            try? await users.incrementRating(userID: targetUserID, type: type)
        }

        // Step 4 — reward the tagger and spend a pellet.
        var expGained = type == .positive ? ExpRewards.positiveTag : ExpRewards.tagDriver
        if coordinate != nil { expGained += ExpRewards.locationBonus }
        if reason.count > 20 { expGained += ExpRewards.detailedReasonBonus }

        let newExp = latest.exp + expGained
        let newLevel = Levels.level(forExp: newExp)

        var values: [String: JSONValue] = [
            "experience": .int(newExp),
            "level": .int(newLevel),
            "pellets_given_count": .int(latest.pelletsGivenCount + 1),
        ]

        if type == .positive {
            values["positive_pellet_count"] = .int(max(0, latest.positivePelletCount - 1))
            values["positive_pellets_given_count"] = .int(latest.positivePelletsGivenCount + 1)
        } else {
            values["negative_pellet_count"] = .int(max(0, latest.pelletCount - 1))
            values["negative_pellets_given_count"] = .int(latest.negativePelletsGivenCount + 1)
        }

        try await users.update(id: user.id, values: values)

        return Result(
            expGained: expGained,
            newExp: newExp,
            newLevel: newLevel,
            leveledUp: newLevel > latest.level,
            matchedRegisteredUser: targetUserID != nil
        )
    }
}
