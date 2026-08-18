import Foundation

/// Applies a shop purchase to the signed-in account.
///
/// Payment capture is intentionally not wired to StoreKit yet — products must be
/// created in App Store Connect first. Fulfillment logic lives here so swapping in
/// a real transaction only means gating `fulfill` behind a completed purchase.
nonisolated enum PurchaseService {
    struct Outcome: Sendable {
        var message: String
        var newNegativeRatingCount: Int
    }

    static func fulfill(item: ShopItem, user: AppUser) async throws -> Outcome {
        let users = UserService.shared
        let latest = (try? await users.fetchUser(id: user.id)) ?? user

        switch item.kind {
        case .purchase:
            let amount = item.pelletCount ?? 0
            if item.pelletType == .positive {
                let updated = latest.positivePelletCount + amount
                try await users.update(id: user.id, values: ["positive_pellet_count": .int(updated)])
                return Outcome(
                    message: "\(amount) positive pellets added. You now have \(updated).",
                    newNegativeRatingCount: latest.negativeRatingCount
                )
            } else {
                let updated = latest.pelletCount + amount
                try await users.update(id: user.id, values: ["negative_pellet_count": .int(updated)])
                return Outcome(
                    message: "\(amount) negative pellets added. You now have \(updated).",
                    newNegativeRatingCount: latest.negativeRatingCount
                )
            }

        case .erase:
            let amount = item.pelletCount ?? 0
            let remaining = max(0, latest.negativeRatingCount - amount)
            try await users.update(id: user.id, values: ["negative_rating_count": .int(remaining)])

            // Remove the oldest matching tags so the public record matches the counter.
            if !latest.fullPlate.isEmpty {
                let received = (try? await PelletService.shared.fetchReceived(plate: latest.fullPlate)) ?? []
                let oldestNegative = received
                    .filter { $0.type == .negative }
                    .sorted { $0.createdAt < $1.createdAt }
                    .prefix(amount)
                for pellet in oldestNegative {
                    try? await PelletService.shared.delete(id: pellet.id)
                }
            }

            return Outcome(
                message: "Removed \(amount) negative tag\(amount == 1 ? "" : "s") from your record.",
                newNegativeRatingCount: remaining
            )

        case .donation:
            return Outcome(
                message: "Thank you for supporting DriveTag!",
                newNegativeRatingCount: latest.negativeRatingCount
            )
        }
    }
}
