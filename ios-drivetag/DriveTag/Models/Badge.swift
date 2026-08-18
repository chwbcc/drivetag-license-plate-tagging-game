import Foundation

nonisolated enum BadgeRarity: String, Codable, Sendable {
    case common, uncommon, rare, epic, legendary

    var label: String { rawValue.capitalized }
}

nonisolated enum BadgeCriteriaType: String, Codable, Sendable {
    case negativePelletsReceived = "negative_pellets_received"
    case positivePelletsReceived = "positive_pellets_received"
    case pelletsGiven = "pellets_given"
    case positivePelletsGiven = "positive_pellets_given"
    case expEarned = "exp_earned"
}

nonisolated struct Badge: Codable, Identifiable, Sendable, Equatable {
    var id: String
    var name: String
    var description: String
    var icon: String
    var criteriaType: BadgeCriteriaType
    var threshold: Int
    var rarity: BadgeRarity
}

/// Snapshot of the counters badge criteria are evaluated against.
nonisolated struct BadgeCounts: Sendable {
    var negativeReceived: Int
    var positiveReceived: Int
    var pelletsGiven: Int
    var positivePelletsGiven: Int
    var expEarned: Int

    init(user: AppUser) {
        negativeReceived = user.negativeRatingCount
        positiveReceived = user.positiveRatingCount
        pelletsGiven = user.pelletsGivenCount
        positivePelletsGiven = user.positivePelletsGivenCount
        expEarned = user.exp
    }

    init(negativeReceived: Int, positiveReceived: Int, pelletsGiven: Int, positivePelletsGiven: Int, expEarned: Int) {
        self.negativeReceived = negativeReceived
        self.positiveReceived = positiveReceived
        self.pelletsGiven = pelletsGiven
        self.positivePelletsGiven = positivePelletsGiven
        self.expEarned = expEarned
    }
}

nonisolated enum BadgeCatalog {
    static let all: [Badge] = [
        Badge(id: "first-tag", name: "First Tag", description: "Tagged your first driver", icon: "🎯", criteriaType: .pelletsGiven, threshold: 1, rarity: .common),
        Badge(id: "tag-master", name: "Tag Master", description: "Tagged 10 drivers", icon: "🏆", criteriaType: .pelletsGiven, threshold: 10, rarity: .uncommon),
        Badge(id: "tag-legend", name: "Tag Legend", description: "Tagged 50 drivers", icon: "👑", criteriaType: .pelletsGiven, threshold: 50, rarity: .rare),
        Badge(id: "first-positive", name: "First Positive", description: "Gave your first positive tag", icon: "👍", criteriaType: .positivePelletsGiven, threshold: 1, rarity: .common),
        Badge(id: "positivity-spreader", name: "Positivity Spreader", description: "Gave 10 positive tags", icon: "😊", criteriaType: .positivePelletsGiven, threshold: 10, rarity: .uncommon),
        Badge(id: "road-angel", name: "Road Angel", description: "Received 5 positive tags", icon: "😇", criteriaType: .positivePelletsReceived, threshold: 5, rarity: .rare),
        Badge(id: "road-menace", name: "Road Menace", description: "Received 5 negative tags", icon: "😈", criteriaType: .negativePelletsReceived, threshold: 5, rarity: .uncommon),
        Badge(id: "infamous-driver", name: "Infamous Driver", description: "Received 20 negative tags", icon: "💀", criteriaType: .negativePelletsReceived, threshold: 20, rarity: .epic),
        Badge(id: "balanced-driver", name: "Balanced Driver", description: "Received equal numbers of positive and negative tags (at least 5 each)", icon: "⚖️", criteriaType: .negativePelletsReceived, threshold: 5, rarity: .legendary),
        Badge(id: "rookie-reporter", name: "Rookie Reporter", description: "Earned 100 experience points", icon: "🔰", criteriaType: .expEarned, threshold: 100, rarity: .common),
        Badge(id: "experienced-reporter", name: "Experienced Reporter", description: "Earned 500 experience points", icon: "📊", criteriaType: .expEarned, threshold: 500, rarity: .uncommon),
        Badge(id: "expert-reporter", name: "Expert Reporter", description: "Earned 1,000 experience points", icon: "📈", criteriaType: .expEarned, threshold: 1000, rarity: .rare),
        Badge(id: "master-reporter", name: "Master Reporter", description: "Earned 5,000 experience points", icon: "🎓", criteriaType: .expEarned, threshold: 5000, rarity: .epic),
        Badge(id: "legendary-reporter", name: "Legendary Reporter", description: "Earned 10,000 experience points", icon: "🏅", criteriaType: .expEarned, threshold: 10000, rarity: .legendary),
        Badge(id: "level-5-achiever", name: "Level 5 Achiever", description: "Reached level 5", icon: "5️⃣", criteriaType: .expEarned, threshold: 1000, rarity: .rare),
        Badge(id: "level-10-achiever", name: "Level 10 Achiever", description: "Reached level 10", icon: "🔟", criteriaType: .expEarned, threshold: 10000, rarity: .epic),
    ]

    static func badge(id: String) -> Badge? { all.first { $0.id == id } }

    /// Returns badge IDs newly satisfied by `counts` that the user does not already hold.
    static func newlyEarned(counts: BadgeCounts, owned: [String]) -> [String] {
        all.compactMap { badge in
            guard !owned.contains(badge.id) else { return nil }

            let met: Bool
            if badge.id == "balanced-driver" {
                met = counts.negativeReceived >= badge.threshold
                    && counts.positiveReceived >= badge.threshold
                    && abs(counts.negativeReceived - counts.positiveReceived) <= 2
            } else {
                switch badge.criteriaType {
                case .negativePelletsReceived: met = counts.negativeReceived >= badge.threshold
                case .positivePelletsReceived: met = counts.positiveReceived >= badge.threshold
                case .pelletsGiven: met = counts.pelletsGiven >= badge.threshold
                case .positivePelletsGiven: met = counts.positivePelletsGiven >= badge.threshold
                case .expEarned: met = counts.expEarned >= badge.threshold
                }
            }
            return met ? badge.id : nil
        }
    }
}
