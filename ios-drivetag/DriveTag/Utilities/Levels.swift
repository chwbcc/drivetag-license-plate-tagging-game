import Foundation

/// Experience thresholds and level math shared by the tagging and profile flows.
nonisolated enum Levels {
    static let thresholds = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 20000, 30000, 50000, 75000]

    static func level(forExp exp: Int) -> Int {
        var result = 1
        for index in 1..<thresholds.count where exp >= thresholds[index] {
            result = index + 1
        }
        return result
    }

    struct Progress {
        var current: Int
        var needed: Int
        var fraction: Double
        var isMaxLevel: Bool
    }

    static func progress(exp: Int, level: Int) -> Progress {
        guard level < thresholds.count else {
            return Progress(current: max(0, exp - (thresholds.last ?? 0)), needed: 0, fraction: 1, isMaxLevel: true)
        }
        let floorExp = thresholds[level - 1]
        let ceilExp = thresholds[level]
        let span = max(1, ceilExp - floorExp)
        let earned = max(0, exp - floorExp)
        return Progress(
            current: earned,
            needed: span,
            fraction: min(1, max(0, Double(earned) / Double(span))),
            isMaxLevel: false
        )
    }
}

/// Experience awarded for tagging actions.
nonisolated enum ExpRewards {
    static let tagDriver = 25
    static let positiveTag = 30
    static let locationBonus = 5
    static let detailedReasonBonus = 10
}
