import Foundation

/// Mirrors the JS `generate-id` helpers so IDs stay compatible across platforms.
nonisolated enum IDGenerator {
    private static func randomSuffix() -> String {
        let alphabet = Array("abcdefghijklmnopqrstuvwxyz0123456789")
        return String((0..<13).map { _ in alphabet.randomElement() ?? "0" })
    }

    private static func timestamp() -> Int { Int(Date().timeIntervalSince1970 * 1000) }

    static func user() -> String { "usr_\(timestamp())_\(randomSuffix())" }
    static func pellet() -> String { "plt_\(timestamp())_\(randomSuffix())" }
    static func badge() -> String { "bdg_\(timestamp())_\(randomSuffix())" }
    static func activity() -> String { "act_\(timestamp())_\(randomSuffix())" }
}
