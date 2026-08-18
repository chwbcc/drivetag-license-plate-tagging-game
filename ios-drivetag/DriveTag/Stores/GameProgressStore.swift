import Foundation
import Observation

/// Locally persisted progress for every passenger game.
@Observable
final class GameProgressStore {
    private let defaults = UserDefaults.standard

    // Spotter games store the set of spotted item IDs.
    var spottedPlates: Set<String> = []
    var spottedCars: Set<String> = []
    var spottedSigns: Set<String> = []
    var spottedAnimals: Set<String> = []

    // Challenge games store high scores.
    var triviaHighScore: Int = 0
    var triviaGamesPlayed: Int = 0
    var triviaCorrect: Int = 0
    var triviaAnswered: Int = 0
    var colorCarHighScore: Int = 0
    var colorCarGamesPlayed: Int = 0

    init() {
        spottedPlates = loadSet("game.plates")
        spottedCars = loadSet("game.cars")
        spottedSigns = loadSet("game.signs")
        spottedAnimals = loadSet("game.animals")
        triviaHighScore = defaults.integer(forKey: "game.trivia.high")
        triviaGamesPlayed = defaults.integer(forKey: "game.trivia.played")
        triviaCorrect = defaults.integer(forKey: "game.trivia.correct")
        triviaAnswered = defaults.integer(forKey: "game.trivia.answered")
        colorCarHighScore = defaults.integer(forKey: "game.color.high")
        colorCarGamesPlayed = defaults.integer(forKey: "game.color.played")
    }

    private func loadSet(_ key: String) -> Set<String> {
        Set(defaults.stringArray(forKey: key) ?? [])
    }

    private func save(_ set: Set<String>, key: String) {
        defaults.set(Array(set), forKey: key)
    }

    // MARK: - Spotter toggles

    func togglePlate(_ id: String) {
        spottedPlates.formSymmetricDifference([id])
        save(spottedPlates, key: "game.plates")
    }

    func toggleCar(_ id: String) {
        spottedCars.formSymmetricDifference([id])
        save(spottedCars, key: "game.cars")
    }

    func toggleSign(_ id: String) {
        spottedSigns.formSymmetricDifference([id])
        save(spottedSigns, key: "game.signs")
    }

    func toggleAnimal(_ id: String) {
        spottedAnimals.formSymmetricDifference([id])
        save(spottedAnimals, key: "game.animals")
    }

    /// Total points from spotted animals, weighted by rarity.
    var animalPoints: Int {
        AnimalCatalog.all.filter { spottedAnimals.contains($0.id) }.reduce(0) { $0 + $1.points }
    }

    // MARK: - Challenge results

    func recordTrivia(score: Int, questionCount: Int) {
        triviaHighScore = max(triviaHighScore, score)
        triviaGamesPlayed += 1
        triviaCorrect += score
        triviaAnswered += questionCount
        defaults.set(triviaHighScore, forKey: "game.trivia.high")
        defaults.set(triviaGamesPlayed, forKey: "game.trivia.played")
        defaults.set(triviaCorrect, forKey: "game.trivia.correct")
        defaults.set(triviaAnswered, forKey: "game.trivia.answered")
    }

    var triviaAccuracy: Int {
        guard triviaAnswered > 0 else { return 0 }
        return Int((Double(triviaCorrect) / Double(triviaAnswered) * 100).rounded())
    }

    func recordColorCar(score: Int) {
        colorCarHighScore = max(colorCarHighScore, score)
        colorCarGamesPlayed += 1
        defaults.set(colorCarHighScore, forKey: "game.color.high")
        defaults.set(colorCarGamesPlayed, forKey: "game.color.played")
    }

    // MARK: - Resets

    func resetPlates() { spottedPlates = []; save([], key: "game.plates") }
    func resetCars() { spottedCars = []; save([], key: "game.cars") }
    func resetSigns() { spottedSigns = []; save([], key: "game.signs") }
    func resetAnimals() { spottedAnimals = []; save([], key: "game.animals") }
}
