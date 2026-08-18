import Foundation

nonisolated enum ShopItemKind: String, Codable, Sendable {
    case purchase
    case erase
    case donation
}

nonisolated struct ShopItem: Identifiable, Sendable {
    var id: String
    var name: String
    var description: String
    var price: Double
    var pelletCount: Int?
    var pelletType: PelletType?
    var kind: ShopItemKind

    var formattedPrice: String {
        price.formatted(.currency(code: "USD"))
    }
}

/// Mirrors the pellet packs, record-erase items, and donation tiers from the RN store.
nonisolated enum ShopCatalog {
    static let all: [ShopItem] = [
        .init(id: "pellet-5", name: "5 Pellets", description: "Purchase 5 negative pellets to tag drivers", price: 1.25, pelletCount: 5, pelletType: .negative, kind: .purchase),
        .init(id: "pellet-10", name: "10 Pellets", description: "Purchase 10 negative pellets to tag drivers", price: 2.50, pelletCount: 10, pelletType: .negative, kind: .purchase),
        .init(id: "pellet-25", name: "25 Pellets", description: "Purchase 25 negative pellets to tag drivers", price: 6.25, pelletCount: 25, pelletType: .negative, kind: .purchase),
        .init(id: "positive-pellet-5", name: "5 Positive Pellets", description: "Purchase 5 positive pellets to praise good drivers", price: 1.25, pelletCount: 5, pelletType: .positive, kind: .purchase),
        .init(id: "positive-pellet-10", name: "10 Positive Pellets", description: "Purchase 10 positive pellets to praise good drivers", price: 2.50, pelletCount: 10, pelletType: .positive, kind: .purchase),
        .init(id: "positive-pellet-25", name: "25 Positive Pellets", description: "Purchase 25 positive pellets to praise good drivers", price: 6.25, pelletCount: 25, pelletType: .positive, kind: .purchase),
        .init(id: "erase-1", name: "Erase 1 Pellet", description: "Remove 1 negative pellet from your record", price: 0.25, pelletCount: 1, pelletType: .negative, kind: .erase),
        .init(id: "erase-5", name: "Erase 5 Pellets", description: "Remove 5 negative pellets from your record", price: 1.25, pelletCount: 5, pelletType: .negative, kind: .erase),
        .init(id: "donation-small", name: "Small Donation", description: "Support DriveTag with a small donation", price: 5.00, pelletCount: nil, pelletType: nil, kind: .donation),
        .init(id: "donation-medium", name: "Medium Donation", description: "Support DriveTag with a medium donation", price: 10.00, pelletCount: nil, pelletType: nil, kind: .donation),
        .init(id: "donation-large", name: "Large Donation", description: "Support DriveTag with a large donation", price: 25.00, pelletCount: nil, pelletType: nil, kind: .donation),
    ]

    static func items(kind: ShopItemKind) -> [ShopItem] {
        all.filter { $0.kind == kind }
    }

    static func negativePacks() -> [ShopItem] {
        items(kind: .purchase).filter { $0.pelletType == .negative }
    }

    static func positivePacks() -> [ShopItem] {
        items(kind: .purchase).filter { $0.pelletType == .positive }
    }
}
