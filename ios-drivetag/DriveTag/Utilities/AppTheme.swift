import SwiftUI

/// Design tokens mirroring the DriveTag React Native palette.
enum AppTheme {
    // Brand
    static let primary = Color(hex: 0x3B82F6)
    static let secondary = Color(hex: 0xF97316)
    static let success = Color(hex: 0x10B981)
    static let error = Color(hex: 0xEF4444)
    static let warning = Color(hex: 0xF59E0B)

    // Accents used on the Driver Score screen
    static let accentGreen = Color(hex: 0x00FF9D)
    static let accentRed = Color(hex: 0xFF3366)
    static let accentYellow = Color(hex: 0xFFD700)
    static let adminGold = Color(hex: 0xFFD700)
    static let analyticsBlue = Color(hex: 0x2563EB)

    // Game accents
    static let violet = Color(hex: 0x8B5CF6)
    static let pink = Color(hex: 0xEC4899)

    /// Rarity colors for badges.
    static func rarityColor(_ rarity: BadgeRarity) -> Color {
        switch rarity {
        case .common: return Color(hex: 0x9CA3AF)
        case .uncommon: return success
        case .rare: return primary
        case .epic: return violet
        case .legendary: return accentYellow
        }
    }
}

extension Color {
    init(hex: UInt32) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: 1)
    }
}

/// Semantic surfaces that adapt to light/dark automatically.
extension ShapeStyle where Self == Color {
    static var appBackground: Color { Color(.systemGroupedBackground) }
    static var appCard: Color { Color(.secondarySystemGroupedBackground) }
}
