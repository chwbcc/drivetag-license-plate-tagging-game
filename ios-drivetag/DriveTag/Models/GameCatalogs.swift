import Foundation

// MARK: - License plate spotter

nonisolated struct StatePlate: Identifiable, Sendable {
    var id: String
    var name: String
    var region: String
}

nonisolated enum PlateCatalog {
    static let all: [StatePlate] = [
        .init(id: "AL", name: "Alabama", region: "South"),
        .init(id: "AK", name: "Alaska", region: "West"),
        .init(id: "AZ", name: "Arizona", region: "West"),
        .init(id: "AR", name: "Arkansas", region: "South"),
        .init(id: "CA", name: "California", region: "West"),
        .init(id: "CO", name: "Colorado", region: "West"),
        .init(id: "CT", name: "Connecticut", region: "Northeast"),
        .init(id: "DE", name: "Delaware", region: "Northeast"),
        .init(id: "FL", name: "Florida", region: "South"),
        .init(id: "GA", name: "Georgia", region: "South"),
        .init(id: "HI", name: "Hawaii", region: "West"),
        .init(id: "ID", name: "Idaho", region: "West"),
        .init(id: "IL", name: "Illinois", region: "Midwest"),
        .init(id: "IN", name: "Indiana", region: "Midwest"),
        .init(id: "IA", name: "Iowa", region: "Midwest"),
        .init(id: "KS", name: "Kansas", region: "Midwest"),
        .init(id: "KY", name: "Kentucky", region: "South"),
        .init(id: "LA", name: "Louisiana", region: "South"),
        .init(id: "ME", name: "Maine", region: "Northeast"),
        .init(id: "MD", name: "Maryland", region: "Northeast"),
        .init(id: "MA", name: "Massachusetts", region: "Northeast"),
        .init(id: "MI", name: "Michigan", region: "Midwest"),
        .init(id: "MN", name: "Minnesota", region: "Midwest"),
        .init(id: "MS", name: "Mississippi", region: "South"),
        .init(id: "MO", name: "Missouri", region: "Midwest"),
        .init(id: "MT", name: "Montana", region: "West"),
        .init(id: "NE", name: "Nebraska", region: "Midwest"),
        .init(id: "NV", name: "Nevada", region: "West"),
        .init(id: "NH", name: "New Hampshire", region: "Northeast"),
        .init(id: "NJ", name: "New Jersey", region: "Northeast"),
        .init(id: "NM", name: "New Mexico", region: "West"),
        .init(id: "NY", name: "New York", region: "Northeast"),
        .init(id: "NC", name: "North Carolina", region: "South"),
        .init(id: "ND", name: "North Dakota", region: "Midwest"),
        .init(id: "OH", name: "Ohio", region: "Midwest"),
        .init(id: "OK", name: "Oklahoma", region: "South"),
        .init(id: "OR", name: "Oregon", region: "West"),
        .init(id: "PA", name: "Pennsylvania", region: "Northeast"),
        .init(id: "RI", name: "Rhode Island", region: "Northeast"),
        .init(id: "SC", name: "South Carolina", region: "South"),
        .init(id: "SD", name: "South Dakota", region: "Midwest"),
        .init(id: "TN", name: "Tennessee", region: "South"),
        .init(id: "TX", name: "Texas", region: "South"),
        .init(id: "UT", name: "Utah", region: "West"),
        .init(id: "VT", name: "Vermont", region: "Northeast"),
        .init(id: "VA", name: "Virginia", region: "South"),
        .init(id: "WA", name: "Washington", region: "West"),
        .init(id: "WV", name: "West Virginia", region: "South"),
        .init(id: "WI", name: "Wisconsin", region: "Midwest"),
        .init(id: "WY", name: "Wyoming", region: "West"),
    ]

    static let regions = ["Northeast", "South", "Midwest", "West"]
}

// MARK: - Car spotter

nonisolated struct CarTarget: Identifiable, Sendable {
    var id: String
    var make: String
    var model: String
    var bodyStyle: String
    var difficulty: Int
}

nonisolated enum CarCatalog {
    static let all: [CarTarget] = [
        .init(id: "toyota-camry", make: "Toyota", model: "Camry", bodyStyle: "Sedan", difficulty: 1),
        .init(id: "honda-civic", make: "Honda", model: "Civic", bodyStyle: "Sedan", difficulty: 1),
        .init(id: "ford-f150", make: "Ford", model: "F-150", bodyStyle: "Truck", difficulty: 1),
        .init(id: "chevy-silverado", make: "Chevrolet", model: "Silverado", bodyStyle: "Truck", difficulty: 1),
        .init(id: "toyota-rav4", make: "Toyota", model: "RAV4", bodyStyle: "SUV", difficulty: 1),
        .init(id: "honda-crv", make: "Honda", model: "CR-V", bodyStyle: "SUV", difficulty: 1),
        .init(id: "jeep-wrangler", make: "Jeep", model: "Wrangler", bodyStyle: "SUV", difficulty: 2),
        .init(id: "tesla-model3", make: "Tesla", model: "Model 3", bodyStyle: "Sedan", difficulty: 2),
        .init(id: "tesla-modely", make: "Tesla", model: "Model Y", bodyStyle: "SUV", difficulty: 2),
        .init(id: "subaru-outback", make: "Subaru", model: "Outback", bodyStyle: "Wagon", difficulty: 2),
        .init(id: "bmw-3series", make: "BMW", model: "3 Series", bodyStyle: "Sedan", difficulty: 2),
        .init(id: "mercedes-cclass", make: "Mercedes-Benz", model: "C-Class", bodyStyle: "Sedan", difficulty: 2),
        .init(id: "ford-mustang", make: "Ford", model: "Mustang", bodyStyle: "Coupe", difficulty: 3),
        .init(id: "chevy-corvette", make: "Chevrolet", model: "Corvette", bodyStyle: "Coupe", difficulty: 4),
        .init(id: "dodge-charger", make: "Dodge", model: "Charger", bodyStyle: "Sedan", difficulty: 3),
        .init(id: "porsche-911", make: "Porsche", model: "911", bodyStyle: "Coupe", difficulty: 4),
        .init(id: "vw-beetle", make: "Volkswagen", model: "Beetle", bodyStyle: "Coupe", difficulty: 4),
        .init(id: "mini-cooper", make: "MINI", model: "Cooper", bodyStyle: "Hatchback", difficulty: 3),
        .init(id: "rivian-r1t", make: "Rivian", model: "R1T", bodyStyle: "Truck", difficulty: 4),
        .init(id: "cybertruck", make: "Tesla", model: "Cybertruck", bodyStyle: "Truck", difficulty: 5),
        .init(id: "ferrari-any", make: "Ferrari", model: "Any model", bodyStyle: "Exotic", difficulty: 5),
        .init(id: "lambo-any", make: "Lamborghini", model: "Any model", bodyStyle: "Exotic", difficulty: 5),
    ]

    static let bodyStyles = ["Sedan", "SUV", "Truck", "Coupe", "Wagon", "Hatchback", "Exotic"]
}

// MARK: - Road sign bingo

nonisolated struct RoadSign: Identifiable, Sendable {
    var id: String
    var name: String
    var symbol: String
    var category: String
}

nonisolated enum SignCatalog {
    static let all: [RoadSign] = [
        .init(id: "stop", name: "Stop", symbol: "octagon.fill", category: "Regulatory"),
        .init(id: "yield", name: "Yield", symbol: "triangle", category: "Regulatory"),
        .init(id: "speed-limit", name: "Speed Limit", symbol: "speedometer", category: "Regulatory"),
        .init(id: "no-parking", name: "No Parking", symbol: "p.circle", category: "Regulatory"),
        .init(id: "one-way", name: "One Way", symbol: "arrow.right", category: "Regulatory"),
        .init(id: "do-not-enter", name: "Do Not Enter", symbol: "minus.circle.fill", category: "Regulatory"),
        .init(id: "railroad", name: "Railroad Crossing", symbol: "xmark.circle", category: "Warning"),
        .init(id: "deer", name: "Deer Crossing", symbol: "hare.fill", category: "Warning"),
        .init(id: "curve", name: "Curve Ahead", symbol: "arrow.turn.up.right", category: "Warning"),
        .init(id: "slippery", name: "Slippery When Wet", symbol: "drop.fill", category: "Warning"),
        .init(id: "pedestrian", name: "Pedestrian Crossing", symbol: "figure.walk", category: "Warning"),
        .init(id: "school-zone", name: "School Zone", symbol: "book.fill", category: "Warning"),
        .init(id: "work-zone", name: "Road Work", symbol: "cone.fill", category: "Warning"),
        .init(id: "interstate", name: "Interstate Shield", symbol: "shield.fill", category: "Guide"),
        .init(id: "us-route", name: "US Route", symbol: "shield.lefthalf.filled", category: "Guide"),
        .init(id: "exit", name: "Exit Number", symbol: "arrow.up.right.square", category: "Guide"),
        .init(id: "rest-area", name: "Rest Area", symbol: "bed.double.fill", category: "Services"),
        .init(id: "gas", name: "Gas Station", symbol: "fuelpump.fill", category: "Services"),
        .init(id: "food", name: "Food", symbol: "fork.knife", category: "Services"),
        .init(id: "hospital", name: "Hospital", symbol: "cross.case.fill", category: "Services"),
        .init(id: "camping", name: "Camping", symbol: "tent.fill", category: "Recreation"),
        .init(id: "scenic", name: "Scenic Overlook", symbol: "camera.fill", category: "Recreation"),
    ]

    static let categories = ["Regulatory", "Warning", "Guide", "Services", "Recreation"]
}

// MARK: - Animal spotter

nonisolated struct SpottableAnimal: Identifiable, Sendable {
    var id: String
    var name: String
    var emoji: String
    var points: Int
    var habitat: String
}

nonisolated enum AnimalCatalog {
    static let all: [SpottableAnimal] = [
        .init(id: "cow", name: "Cow", emoji: "🐄", points: 5, habitat: "Farmland"),
        .init(id: "horse", name: "Horse", emoji: "🐴", points: 5, habitat: "Farmland"),
        .init(id: "sheep", name: "Sheep", emoji: "🐑", points: 8, habitat: "Farmland"),
        .init(id: "goat", name: "Goat", emoji: "🐐", points: 10, habitat: "Farmland"),
        .init(id: "dog", name: "Dog", emoji: "🐕", points: 3, habitat: "Anywhere"),
        .init(id: "cat", name: "Cat", emoji: "🐈", points: 5, habitat: "Anywhere"),
        .init(id: "bird", name: "Bird", emoji: "🐦", points: 2, habitat: "Anywhere"),
        .init(id: "hawk", name: "Hawk", emoji: "🦅", points: 15, habitat: "Open sky"),
        .init(id: "deer", name: "Deer", emoji: "🦌", points: 15, habitat: "Woodland"),
        .init(id: "rabbit", name: "Rabbit", emoji: "🐇", points: 10, habitat: "Woodland"),
        .init(id: "squirrel", name: "Squirrel", emoji: "🐿️", points: 5, habitat: "Woodland"),
        .init(id: "fox", name: "Fox", emoji: "🦊", points: 25, habitat: "Woodland"),
        .init(id: "raccoon", name: "Raccoon", emoji: "🦝", points: 20, habitat: "Woodland"),
        .init(id: "turtle", name: "Turtle", emoji: "🐢", points: 20, habitat: "Wetland"),
        .init(id: "duck", name: "Duck", emoji: "🦆", points: 8, habitat: "Wetland"),
        .init(id: "heron", name: "Heron", emoji: "🪶", points: 25, habitat: "Wetland"),
        .init(id: "bear", name: "Bear", emoji: "🐻", points: 50, habitat: "Wilderness"),
        .init(id: "moose", name: "Moose", emoji: "🫎", points: 50, habitat: "Wilderness"),
        .init(id: "elk", name: "Elk", emoji: "🦬", points: 40, habitat: "Wilderness"),
        .init(id: "coyote", name: "Coyote", emoji: "🐺", points: 35, habitat: "Wilderness"),
    ]

    static let habitats = ["Anywhere", "Farmland", "Woodland", "Wetland", "Open sky", "Wilderness"]
}

// MARK: - Trivia

nonisolated struct TriviaQuestion: Identifiable, Sendable {
    var id: String
    var prompt: String
    var options: [String]
    var answerIndex: Int
    var explanation: String
}

nonisolated enum TriviaCatalog {
    static let questionsPerRound = 10

    static let all: [TriviaQuestion] = [
        .init(id: "q1", prompt: "Which US interstate is the longest?", options: ["I-90", "I-80", "I-10", "I-95"], answerIndex: 0, explanation: "I-90 runs about 3,020 miles from Seattle to Boston."),
        .init(id: "q2", prompt: "What does a flashing yellow traffic light mean?", options: ["Stop completely", "Proceed with caution", "Speed up", "Road closed"], answerIndex: 1, explanation: "A flashing yellow means slow down and proceed carefully."),
        .init(id: "q3", prompt: "Which state has the most miles of highway?", options: ["California", "Texas", "Alaska", "Montana"], answerIndex: 1, explanation: "Texas has the largest state highway network in the country."),
        .init(id: "q4", prompt: "What color are US interstate route signs?", options: ["Green and white", "Red and blue", "Blue and red with white", "Yellow and black"], answerIndex: 2, explanation: "Interstate shields are blue with a red top band and white numerals."),
        .init(id: "q5", prompt: "Odd-numbered interstates generally run which direction?", options: ["East-West", "North-South", "In circles", "Diagonally"], answerIndex: 1, explanation: "Odd numbers run north-south; even numbers run east-west."),
        .init(id: "q6", prompt: "What is the national speed limit sign shape in the US?", options: ["Octagon", "Circle", "Vertical rectangle", "Diamond"], answerIndex: 2, explanation: "Speed limit signs are vertical white rectangles."),
        .init(id: "q7", prompt: "Which highway is famously called the 'Mother Road'?", options: ["Route 1", "Route 66", "I-40", "The PCH"], answerIndex: 1, explanation: "Route 66 earned the nickname in Steinbeck's The Grapes of Wrath."),
        .init(id: "q8", prompt: "A diamond-shaped road sign indicates what?", options: ["Warning", "Service", "Regulation", "Recreation"], answerIndex: 0, explanation: "Diamond signs warn drivers about upcoming conditions."),
        .init(id: "q9", prompt: "What is the highest paved road in the continental US?", options: ["Pikes Peak Highway", "Mount Evans Road", "Trail Ridge Road", "Beartooth Highway"], answerIndex: 1, explanation: "Mount Evans Road tops out above 14,000 feet."),
        .init(id: "q10", prompt: "How many states does I-95 pass through?", options: ["12", "15", "16", "20"], answerIndex: 1, explanation: "I-95 runs through 15 states along the East Coast."),
        .init(id: "q11", prompt: "What does 'HOV' stand for on highway signs?", options: ["Heavy Oil Vehicle", "High Occupancy Vehicle", "Highway Overpass Vector", "Hybrid Only Vehicle"], answerIndex: 1, explanation: "HOV lanes are reserved for vehicles carrying multiple passengers."),
        .init(id: "q12", prompt: "Which state is home to the 'Loneliest Road in America'?", options: ["Nevada", "Utah", "Wyoming", "New Mexico"], answerIndex: 0, explanation: "US Route 50 across Nevada earned that nickname."),
        .init(id: "q13", prompt: "What should you do when an emergency vehicle approaches with sirens?", options: ["Speed up", "Stop in the lane", "Pull right and stop", "Turn on hazards only"], answerIndex: 2, explanation: "Pull to the right and stop until the vehicle passes."),
        .init(id: "q14", prompt: "Which bridge is the longest suspension bridge in the US?", options: ["Golden Gate", "Verrazzano-Narrows", "Mackinac", "Brooklyn"], answerIndex: 1, explanation: "The Verrazzano-Narrows Bridge spans 4,260 feet."),
        .init(id: "q15", prompt: "What does a solid white line between lanes mean?", options: ["Passing encouraged", "Lane changes discouraged", "Shoulder only", "Bike lane"], answerIndex: 1, explanation: "Solid white lines discourage lane changes."),
        .init(id: "q16", prompt: "Which national park has the most visitors annually?", options: ["Yellowstone", "Yosemite", "Great Smoky Mountains", "Zion"], answerIndex: 2, explanation: "Great Smoky Mountains leads the country in visitor numbers."),
        .init(id: "q17", prompt: "What is the minimum following distance rule of thumb?", options: ["1 second", "2 seconds", "3 seconds", "5 seconds"], answerIndex: 2, explanation: "The three-second rule gives you room to react safely."),
        .init(id: "q18", prompt: "Route numbers on green signs typically indicate what?", options: ["Warnings", "Guide/direction info", "Speed limits", "Construction"], answerIndex: 1, explanation: "Green signs carry guidance and directional information."),
    ]

    static func round() -> [TriviaQuestion] {
        Array(all.shuffled().prefix(questionsPerRound))
    }
}

// MARK: - Color car count

nonisolated struct CarColorOption: Identifiable, Sendable {
    var id: String
    var name: String
    var hex: UInt32
}

nonisolated enum CarColorCatalog {
    static let all: [CarColorOption] = [
        .init(id: "white", name: "White", hex: 0xF3F4F6),
        .init(id: "black", name: "Black", hex: 0x111827),
        .init(id: "silver", name: "Silver", hex: 0x9CA3AF),
        .init(id: "red", name: "Red", hex: 0xEF4444),
        .init(id: "blue", name: "Blue", hex: 0x3B82F6),
        .init(id: "green", name: "Green", hex: 0x10B981),
        .init(id: "yellow", name: "Yellow", hex: 0xF59E0B),
        .init(id: "orange", name: "Orange", hex: 0xF97316),
    ]

    static let roundSeconds = 60
}
