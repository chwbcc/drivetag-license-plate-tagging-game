import SwiftUI

// MARK: - Shared spotter chrome

/// Header showing collected/total with a ring, reused by every spotter game.
private struct SpotterHeader: View {
    let collected: Int
    let total: Int
    let tint: Color
    let subtitle: String
    var extraValue: String?
    var extraLabel: String?

    var body: some View {
        CardContainer {
            HStack(spacing: 18) {
                RingGauge(value: collected, total: total, label: "collected", tint: tint, size: 84)

                VStack(alignment: .leading, spacing: 6) {
                    if let extraValue, let extraLabel {
                        Text(extraValue)
                            .font(.title.weight(.heavy))
                            .foregroundStyle(tint)
                            .contentTransition(.numericText())
                        Text(extraLabel.uppercased())
                            .font(.caption2.weight(.bold))
                            .kerning(1)
                            .foregroundStyle(.secondary)
                    }
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
        }
    }
}

/// Checkable row used in spotter lists.
private struct SpotRow: View {
    let title: String
    let subtitle: String
    let leading: AnyView
    let isSpotted: Bool
    let tint: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                leading
                    .frame(width: 40, height: 40)
                    .background(
                        (isSpotted ? tint : Color.gray).opacity(0.14),
                        in: .rect(cornerRadius: 11)
                    )

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 0)

                Image(systemName: isSpotted ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(isSpotted ? tint : Color.secondary.opacity(0.45))
                    .symbolEffect(.bounce, value: isSpotted)
            }
            .padding(12)
            .background(Color.appCard, in: .rect(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSpotted ? tint.opacity(0.4) : .clear, lineWidth: 1.5)
            }
        }
        .buttonStyle(.pressable)
    }
}

// MARK: - License plate spotter

struct PlateSpotterView: View {
    @Environment(GameProgressStore.self) private var games
    @State private var showResetConfirm: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                SpotterHeader(
                    collected: games.spottedPlates.count,
                    total: PlateCatalog.all.count,
                    tint: AppTheme.primary,
                    subtitle: "Tap a state when you spot its plate. Progress saves automatically."
                )

                ForEach(PlateCatalog.regions, id: \.self) { region in
                    let states = PlateCatalog.all.filter { $0.region == region }
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            SectionLabel(text: region)
                            Text("\(states.filter { games.spottedPlates.contains($0.id) }.count)/\(states.count)")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(AppTheme.primary)
                        }

                        ForEach(states) { plate in
                            SpotRow(
                                title: plate.name,
                                subtitle: plate.id,
                                leading: AnyView(
                                    Text(plate.id)
                                        .font(.system(size: 13, weight: .heavy, design: .monospaced))
                                        .foregroundStyle(games.spottedPlates.contains(plate.id) ? AppTheme.primary : .secondary)
                                ),
                                isSpotted: games.spottedPlates.contains(plate.id),
                                tint: AppTheme.primary
                            ) {
                                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                    games.togglePlate(plate.id)
                                }
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("License Plate Spotter")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { resetToolbar { showResetConfirm = true } }
        .confirmationDialog("Reset all spotted plates?", isPresented: $showResetConfirm, titleVisibility: .visible) {
            Button("Reset", role: .destructive) { games.resetPlates() }
            Button("Cancel", role: .cancel) {}
        }
    }
}

// MARK: - Car spotter

struct CarSpotterView: View {
    @Environment(GameProgressStore.self) private var games
    @State private var showResetConfirm: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                SpotterHeader(
                    collected: games.spottedCars.count,
                    total: CarCatalog.all.count,
                    tint: AppTheme.success,
                    subtitle: "Harder cars are worth bragging rights. Difficulty is shown in stars."
                )

                ForEach(CarCatalog.bodyStyles, id: \.self) { style in
                    let cars = CarCatalog.all.filter { $0.bodyStyle == style }
                    if !cars.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                SectionLabel(text: style)
                                Text("\(cars.filter { games.spottedCars.contains($0.id) }.count)/\(cars.count)")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(AppTheme.success)
                            }

                            ForEach(cars) { car in
                                SpotRow(
                                    title: "\(car.make) \(car.model)",
                                    subtitle: String(repeating: "★", count: car.difficulty),
                                    leading: AnyView(
                                        Image(systemName: "car.fill")
                                            .foregroundStyle(games.spottedCars.contains(car.id) ? AppTheme.success : .secondary)
                                    ),
                                    isSpotted: games.spottedCars.contains(car.id),
                                    tint: AppTheme.success
                                ) {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                        games.toggleCar(car.id)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Car Spotter")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { resetToolbar { showResetConfirm = true } }
        .confirmationDialog("Reset all spotted cars?", isPresented: $showResetConfirm, titleVisibility: .visible) {
            Button("Reset", role: .destructive) { games.resetCars() }
            Button("Cancel", role: .cancel) {}
        }
    }
}

// MARK: - Road sign bingo

struct RoadSignBingoView: View {
    @Environment(GameProgressStore.self) private var games
    @State private var showResetConfirm: Bool = false

    private var hasBingo: Bool { games.spottedSigns.count >= SignCatalog.all.count }

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                SpotterHeader(
                    collected: games.spottedSigns.count,
                    total: SignCatalog.all.count,
                    tint: AppTheme.secondary,
                    subtitle: hasBingo ? "BINGO! You found every sign." : "Fill the whole card to call bingo."
                )

                LazyVGrid(columns: Array(repeating: GridItem(spacing: 10), count: 3), spacing: 10) {
                    ForEach(SignCatalog.all) { sign in
                        let isSpotted = games.spottedSigns.contains(sign.id)
                        Button {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                games.toggleSign(sign.id)
                            }
                        } label: {
                            VStack(spacing: 7) {
                                Image(systemName: sign.symbol)
                                    .font(.system(size: 24))
                                    .foregroundStyle(isSpotted ? .white : AppTheme.secondary)
                                Text(sign.name)
                                    .font(.system(size: 11, weight: .semibold))
                                    .multilineTextAlignment(.center)
                                    .lineLimit(2)
                                    .minimumScaleFactor(0.8)
                                    .foregroundStyle(isSpotted ? .white : .primary)
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 92)
                            .background(
                                isSpotted ? AppTheme.secondary : Color.appCard,
                                in: .rect(cornerRadius: 14)
                            )
                            .overlay(alignment: .topTrailing) {
                                if isSpotted {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(.white)
                                        .padding(7)
                                }
                            }
                        }
                        .buttonStyle(.pressable)
                    }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Road Sign Bingo")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { resetToolbar { showResetConfirm = true } }
        .confirmationDialog("Reset your bingo card?", isPresented: $showResetConfirm, titleVisibility: .visible) {
            Button("Reset", role: .destructive) { games.resetSigns() }
            Button("Cancel", role: .cancel) {}
        }
    }
}

// MARK: - Animal spotter

struct AnimalSpotterView: View {
    @Environment(GameProgressStore.self) private var games
    @State private var showResetConfirm: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                SpotterHeader(
                    collected: games.spottedAnimals.count,
                    total: AnimalCatalog.all.count,
                    tint: AppTheme.success,
                    subtitle: "Rarer animals are worth more points.",
                    extraValue: "\(games.animalPoints)",
                    extraLabel: "points"
                )

                ForEach(AnimalCatalog.habitats, id: \.self) { habitat in
                    let animals = AnimalCatalog.all.filter { $0.habitat == habitat }
                    if !animals.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            SectionLabel(text: habitat)

                            ForEach(animals) { animal in
                                SpotRow(
                                    title: animal.name,
                                    subtitle: "\(animal.points) pts",
                                    leading: AnyView(Text(animal.emoji).font(.system(size: 22))),
                                    isSpotted: games.spottedAnimals.contains(animal.id),
                                    tint: AppTheme.success
                                ) {
                                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                        games.toggleAnimal(animal.id)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Animal Spotter")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { resetToolbar { showResetConfirm = true } }
        .confirmationDialog("Reset spotted animals?", isPresented: $showResetConfirm, titleVisibility: .visible) {
            Button("Reset", role: .destructive) { games.resetAnimals() }
            Button("Cancel", role: .cancel) {}
        }
    }
}

// MARK: - Toolbar helper

@ToolbarContentBuilder
private func resetToolbar(action: @escaping () -> Void) -> some ToolbarContent {
    ToolbarItem(placement: .topBarTrailing) {
        Button(action: action) {
            Image(systemName: "arrow.counterclockwise")
        }
        .accessibilityLabel("Reset progress")
    }
}
