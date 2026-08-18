import CryptoKit
import Foundation

nonisolated enum Hashing {
    /// SHA-256 hex digest — byte-for-byte compatible with the Expo app's `hashPassword`.
    static func hashPassword(_ password: String) -> String {
        let digest = SHA256.hash(data: Data(password.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    /// Anonymizes a plate into a stable `Driver #ABC123` label.
    /// Reimplements the JS 32-bit rolling hash so labels match the web app exactly.
    static func anonymizePlate(_ plate: String) -> String {
        guard !plate.isEmpty else { return "Unknown" }

        var hash: Int32 = 0
        for scalar in plate.unicodeScalars {
            let char = Int32(truncatingIfNeeded: Int(scalar.value))
            hash = (hash << 5).subtractingReportingOverflow(hash).partialValue
                .addingReportingOverflow(char).partialValue
        }

        let magnitude = UInt32(hash.magnitude)
        let encoded = base36(magnitude).uppercased()
        return "Driver #\(String(encoded.prefix(6)))"
    }

    private static func base36(_ value: UInt32) -> String {
        guard value > 0 else { return "0" }
        let digits = Array("0123456789abcdefghijklmnopqrstuvwxyz")
        var result = ""
        var remaining = value
        while remaining > 0 {
            result = String(digits[Int(remaining % 36)]) + result
            remaining /= 36
        }
        return result
    }
}
