import SwiftUI

/// Pick a car color, then tap every time you see one before the timer runs out.
struct ColorCarGameView: View {
    @Environment(GameProgressStore.self) private var games

    private enum Phase { case setup, playing, finished }

    @State private var phase: Phase = .setup
    @State private var selectedColor: CarColorOption = CarColorCatalog.all[3]
    @State private var secondsRemaining: Int = CarColorCatalog.roundSeconds
    @State private var count: Int = 0
    @State private var tapPulse: Int = 0
    @State private var hasRecorded: Bool = false

    var body: some View {
        ScrollView {
            VStack(spacing: 18) {
                switch phase {
                case .setup: setupView
                case .playing: playingView
                case .finished: resultsView
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Color Car Count")
        .navigationBarTitleDisplayMode(.inline)
        .animation(.smooth(duration: 0.3), value: phase)
    }

    // MARK: - Setup

    private var setupView: some View {
        VStack(spacing: 18) {
            Image(systemName: "paintpalette.fill")
                .font(.system(size: 52))
                .foregroundStyle(AppTheme.pink)
                .padding(.top, 16)

            Text("Pick your color")
                .font(.title2.weight(.heavy))
            Text("Count how many cars of that color you spot in \(CarColorCatalog.roundSeconds) seconds.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            LazyVGrid(columns: Array(repeating: GridItem(spacing: 10), count: 4), spacing: 10) {
                ForEach(CarColorCatalog.all) { option in
                    Button {
                        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                            selectedColor = option
                        }
                    } label: {
                        VStack(spacing: 6) {
                            Circle()
                                .fill(Color(hex: option.hex))
                                .frame(width: 38, height: 38)
                                .overlay {
                                    Circle().stroke(Color.primary.opacity(0.15), lineWidth: 1)
                                }
                                .overlay {
                                    if selectedColor.id == option.id {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 15, weight: .bold))
                                            .foregroundStyle(option.id == "black" ? .white : .black)
                                    }
                                }
                            Text(option.name)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            selectedColor.id == option.id ? AppTheme.pink.opacity(0.12) : Color.appCard,
                            in: .rect(cornerRadius: 12)
                        )
                    }
                    .buttonStyle(.pressable)
                }
            }

            HStack(spacing: 12) {
                infoTile("\(games.colorCarHighScore)", label: "Best count")
                infoTile("\(games.colorCarGamesPlayed)", label: "Rounds played")
            }

            PrimaryButton(title: "Start 60 Seconds", systemImage: "timer", tint: AppTheme.pink) {
                start()
            }
        }
    }

    private func infoTile(_ value: String, label: String) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(AppTheme.pink)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color.appCard, in: .rect(cornerRadius: 12))
    }

    // MARK: - Playing

    private var playingView: some View {
        VStack(spacing: 20) {
            HStack {
                Label("\(secondsRemaining)s", systemImage: "timer")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(secondsRemaining <= 10 ? AppTheme.error : .primary)
                    .contentTransition(.numericText(countsDown: true))
                Spacer()
                HStack(spacing: 6) {
                    Circle()
                        .fill(Color(hex: selectedColor.hex))
                        .frame(width: 16, height: 16)
                    Text(selectedColor.name)
                        .font(.subheadline.weight(.semibold))
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.primary.opacity(0.08))
                    Capsule()
                        .fill(secondsRemaining <= 10 ? AppTheme.error : AppTheme.pink)
                        .frame(width: geo.size.width * (Double(secondsRemaining) / Double(CarColorCatalog.roundSeconds)))
                        .animation(.linear(duration: 1), value: secondsRemaining)
                }
            }
            .frame(height: 8)

            // Big tap target — the whole card counts a car.
            Button {
                count += 1
                tapPulse += 1
            } label: {
                VStack(spacing: 10) {
                    Text("\(count)")
                        .font(.system(size: 84, weight: .heavy, design: .rounded))
                        .foregroundStyle(Color(hex: selectedColor.hex))
                        .contentTransition(.numericText())
                    Text("TAP WHEN YOU SEE ONE")
                        .font(.caption.weight(.bold))
                        .kerning(1.4)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 240)
                .background(Color.appCard, in: .rect(cornerRadius: 22))
                .overlay {
                    RoundedRectangle(cornerRadius: 22)
                        .stroke(Color(hex: selectedColor.hex).opacity(0.4), lineWidth: 2)
                }
                .scaleEffect(1)
                .symbolEffect(.bounce, value: tapPulse)
            }
            .buttonStyle(.pressable)
            .sensoryFeedback(.increase, trigger: tapPulse)

            HStack(spacing: 12) {
                SecondaryButton(title: "Undo", systemImage: "arrow.uturn.backward", tint: AppTheme.secondary) {
                    count = max(0, count - 1)
                }
                SecondaryButton(title: "End Round", systemImage: "stop.fill", tint: AppTheme.error) {
                    finish()
                }
            }
        }
        .task(id: phase) {
            guard phase == .playing else { return }
            // Drive the countdown while the round is active.
            while secondsRemaining > 0, phase == .playing {
                try? await Task.sleep(for: .seconds(1))
                guard phase == .playing else { return }
                secondsRemaining -= 1
            }
            if phase == .playing { finish() }
        }
    }

    // MARK: - Results

    private var resultsView: some View {
        VStack(spacing: 18) {
            Circle()
                .fill(Color(hex: selectedColor.hex))
                .frame(width: 70, height: 70)
                .overlay {
                    Image(systemName: "car.fill")
                        .font(.system(size: 30))
                        .foregroundStyle(selectedColor.id == "white" || selectedColor.id == "yellow" ? .black : .white)
                }
                .padding(.top, 16)

            Text("\(count)")
                .font(.system(size: 62, weight: .heavy, design: .rounded))
                .contentTransition(.numericText())

            Text("\(selectedColor.name.lowercased()) car\(count == 1 ? "" : "s") spotted")
                .font(.headline)

            Text(count >= games.colorCarHighScore && count > 0
                 ? "New personal best!"
                 : "Best so far: \(games.colorCarHighScore)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            PrimaryButton(title: "Play Again", systemImage: "arrow.clockwise", tint: AppTheme.pink) {
                phase = .setup
            }
            .padding(.top, 4)
        }
    }

    // MARK: - Flow

    private func start() {
        count = 0
        secondsRemaining = CarColorCatalog.roundSeconds
        hasRecorded = false
        phase = .playing
    }

    private func finish() {
        if !hasRecorded {
            games.recordColorCar(score: count)
            hasRecorded = true
        }
        phase = .finished
    }
}
