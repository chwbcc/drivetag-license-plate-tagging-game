import SwiftUI

/// "Let's Play" hub listing spotter and challenge games with live progress.
struct GamesView: View {
    @Environment(GameProgressStore.self) private var games

    private enum Route: Hashable {
        case plates, cars, signs, animals, trivia, colorCar
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    header

                    VStack(alignment: .leading, spacing: 10) {
                        SectionLabel(text: "Spotter Games")

                        gameCard(
                            route: .plates,
                            title: "License Plate Spotter",
                            description: "Spot all 50 US state license plates",
                            systemImage: "mappin.and.ellipse",
                            tint: AppTheme.primary,
                            stat: "\(games.spottedPlates.count)/\(PlateCatalog.all.count)",
                            statLabel: "spotted",
                            progress: Double(games.spottedPlates.count) / Double(PlateCatalog.all.count)
                        )

                        gameCard(
                            route: .cars,
                            title: "Car Spotter",
                            description: "Identify car makes, models & body styles",
                            systemImage: "car.fill",
                            tint: AppTheme.success,
                            stat: "\(games.spottedCars.count)",
                            statLabel: "cars",
                            progress: Double(games.spottedCars.count) / Double(CarCatalog.all.count)
                        )

                        gameCard(
                            route: .signs,
                            title: "Road Sign Bingo",
                            description: "Spot road signs from stop to interstate",
                            systemImage: "signpost.right.fill",
                            tint: AppTheme.secondary,
                            stat: "\(games.spottedSigns.count)/\(SignCatalog.all.count)",
                            statLabel: "signs",
                            progress: Double(games.spottedSigns.count) / Double(SignCatalog.all.count)
                        )

                        gameCard(
                            route: .animals,
                            title: "Animal Spotter",
                            description: "Spot animals along the road for points",
                            systemImage: "pawprint.fill",
                            tint: AppTheme.success,
                            stat: "\(games.animalPoints)",
                            statLabel: "pts",
                            progress: Double(games.spottedAnimals.count) / Double(AnimalCatalog.all.count)
                        )
                    }

                    VStack(alignment: .leading, spacing: 10) {
                        SectionLabel(text: "Challenge Games")

                        gameCard(
                            route: .trivia,
                            title: "Road Trip Trivia",
                            description: "Test your knowledge of US geography & roads",
                            systemImage: "brain.head.profile",
                            tint: AppTheme.violet,
                            stat: games.triviaHighScore > 0 ? "\(games.triviaHighScore)/\(TriviaCatalog.questionsPerRound)" : "--",
                            statLabel: "best",
                            progress: nil
                        )

                        gameCard(
                            route: .colorCar,
                            title: "Color Car Count",
                            description: "Pick a color and count cars in 60 seconds",
                            systemImage: "paintpalette.fill",
                            tint: AppTheme.pink,
                            stat: games.colorCarHighScore > 0 ? "\(games.colorCarHighScore)" : "--",
                            statLabel: "best",
                            progress: nil
                        )
                    }

                    passengerNotice
                }
                .padding(16)
                .padding(.bottom, 60)
            }
            .background(Color.appBackground)
            .navigationTitle("Let's Play")
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .plates: PlateSpotterView()
                case .cars: CarSpotterView()
                case .signs: RoadSignBingoView()
                case .animals: AnimalSpotterView()
                case .trivia: TriviaGameView()
                case .colorCar: ColorCarGameView()
                }
            }
        }
    }

    private var header: some View {
        HStack(spacing: 14) {
            Image(systemName: "gamecontroller.fill")
                .font(.system(size: 26))
                .foregroundStyle(AppTheme.primary)
                .frame(width: 56, height: 56)
                .background(AppTheme.primary.opacity(0.14), in: .rect(cornerRadius: 16))

            VStack(alignment: .leading, spacing: 2) {
                Text("Passenger Games")
                    .font(.title2.weight(.heavy))
                Text("Fun games to play on the road")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
    }

    private func gameCard(
        route: Route,
        title: String,
        description: String,
        systemImage: String,
        tint: Color,
        stat: String,
        statLabel: String,
        progress: Double?
    ) -> some View {
        NavigationLink(value: route) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: systemImage)
                        .font(.system(size: 22))
                        .foregroundStyle(tint)
                        .frame(width: 48, height: 48)
                        .background(tint.opacity(0.14), in: .rect(cornerRadius: 14))

                    Spacer()

                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text(stat)
                            .font(.headline.weight(.bold))
                            .foregroundStyle(tint)
                            .contentTransition(.numericText())
                        Text(statLabel)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }

                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }

                Text(title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)

                if let progress {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule().fill(Color.primary.opacity(0.08))
                            Capsule()
                                .fill(tint)
                                .frame(width: max(4, geo.size.width * min(1, progress)))
                                .animation(.smooth(duration: 0.6), value: progress)
                        }
                    }
                    .frame(height: 5)
                    .padding(.top, 2)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.appCard, in: .rect(cornerRadius: 16))
        }
        .buttonStyle(.pressable)
    }

    private var passengerNotice: some View {
        VStack(alignment: .leading, spacing: 5) {
            Label("Passengers Only", systemImage: "exclamationmark.triangle.fill")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(AppTheme.secondary)
            Text("These games are designed for passengers. Drivers should always keep their eyes on the road.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(AppTheme.secondary.opacity(0.1), in: .rect(cornerRadius: 14))
        .overlay(alignment: .leading) {
            Rectangle()
                .fill(AppTheme.secondary)
                .frame(width: 4)
                .clipShape(.rect(topLeadingRadius: 14, bottomLeadingRadius: 14))
        }
    }
}
