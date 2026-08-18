import SwiftUI

/// Ten-question road trivia round with instant feedback and a results screen.
struct TriviaGameView: View {
    @Environment(GameProgressStore.self) private var games

    private enum Phase { case intro, playing, finished }

    @State private var phase: Phase = .intro
    @State private var questions: [TriviaQuestion] = []
    @State private var index: Int = 0
    @State private var score: Int = 0
    @State private var selectedOption: Int?
    @State private var hasRecorded: Bool = false

    private var current: TriviaQuestion? {
        questions.indices.contains(index) ? questions[index] : nil
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                switch phase {
                case .intro: introView
                case .playing: playingView
                case .finished: resultsView
                }
            }
            .padding(16)
        }
        .background(Color.appBackground)
        .navigationTitle("Road Trip Trivia")
        .navigationBarTitleDisplayMode(.inline)
        .animation(.smooth(duration: 0.3), value: phase)
        .animation(.smooth(duration: 0.25), value: index)
    }

    // MARK: - Intro

    private var introView: some View {
        VStack(spacing: 18) {
            Image(systemName: "brain.head.profile")
                .font(.system(size: 54))
                .foregroundStyle(AppTheme.violet)
                .padding(.top, 20)

            Text("Road Trip Trivia")
                .font(.title.weight(.heavy))
            Text("\(TriviaCatalog.questionsPerRound) questions on US highways, signs, and geography.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            HStack(spacing: 12) {
                statTile("\(games.triviaHighScore)", label: "Best score", tint: AppTheme.violet)
                statTile("\(games.triviaAccuracy)%", label: "Accuracy", tint: AppTheme.primary)
                statTile("\(games.triviaGamesPlayed)", label: "Rounds", tint: AppTheme.secondary)
            }

            PrimaryButton(title: "Start Round", systemImage: "play.fill", tint: AppTheme.violet) {
                startRound()
            }
        }
    }

    private func statTile(_ value: String, label: String, tint: Color) -> some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(tint)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color.appCard, in: .rect(cornerRadius: 12))
    }

    // MARK: - Playing

    private var playingView: some View {
        VStack(spacing: 16) {
            VStack(spacing: 8) {
                HStack {
                    Text("Question \(index + 1) of \(questions.count)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("Score \(score)")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(AppTheme.violet)
                        .contentTransition(.numericText())
                }

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.primary.opacity(0.08))
                        Capsule()
                            .fill(AppTheme.violet)
                            .frame(width: geo.size.width * (Double(index) / Double(max(1, questions.count))))
                            .animation(.smooth(duration: 0.4), value: index)
                    }
                }
                .frame(height: 6)
            }

            if let current {
                CardContainer(padding: 18) {
                    Text(current.prompt)
                        .font(.title3.weight(.semibold))
                        .fixedSize(horizontal: false, vertical: true)
                }

                VStack(spacing: 10) {
                    ForEach(Array(current.options.enumerated()), id: \.offset) { optionIndex, option in
                        answerButton(current: current, optionIndex: optionIndex, option: option)
                    }
                }

                if selectedOption != nil {
                    CardContainer {
                        VStack(alignment: .leading, spacing: 6) {
                            Label(
                                selectedOption == current.answerIndex ? "Correct!" : "Not quite",
                                systemImage: selectedOption == current.answerIndex ? "checkmark.circle.fill" : "xmark.circle.fill"
                            )
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(selectedOption == current.answerIndex ? AppTheme.success : AppTheme.error)

                            Text(current.explanation)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    .transition(.opacity.combined(with: .move(edge: .bottom)))

                    PrimaryButton(
                        title: index == questions.count - 1 ? "See Results" : "Next Question",
                        systemImage: "arrow.right",
                        tint: AppTheme.violet
                    ) {
                        advance()
                    }
                }
            }
        }
    }

    private func answerButton(current: TriviaQuestion, optionIndex: Int, option: String) -> some View {
        let isAnswered = selectedOption != nil
        let isCorrectAnswer = optionIndex == current.answerIndex
        let isChosen = selectedOption == optionIndex

        let tint: Color = {
            guard isAnswered else { return .primary }
            if isCorrectAnswer { return AppTheme.success }
            return isChosen ? AppTheme.error : .secondary
        }()

        let background: Color = {
            guard isAnswered else { return Color.appCard }
            if isCorrectAnswer { return AppTheme.success.opacity(0.15) }
            return isChosen ? AppTheme.error.opacity(0.15) : Color.appCard
        }()

        return Button {
            guard selectedOption == nil else { return }
            withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) {
                selectedOption = optionIndex
                if isCorrectAnswer { score += 1 }
            }
        } label: {
            HStack(spacing: 12) {
                Text(String(UnicodeScalar(65 + optionIndex) ?? "A"))
                    .font(.caption.weight(.bold))
                    .foregroundStyle(tint)
                    .frame(width: 26, height: 26)
                    .background(tint.opacity(0.15), in: .circle)

                Text(option)
                    .font(.subheadline)
                    .foregroundStyle(isAnswered && !isCorrectAnswer && !isChosen ? .secondary : .primary)
                    .multilineTextAlignment(.leading)

                Spacer(minLength: 0)

                if isAnswered && isCorrectAnswer {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(AppTheme.success)
                } else if isChosen {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(AppTheme.error)
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(background, in: .rect(cornerRadius: 12))
        }
        .buttonStyle(.pressable)
        .disabled(isAnswered)
    }

    // MARK: - Results

    private var resultsView: some View {
        VStack(spacing: 18) {
            Image(systemName: score >= 8 ? "star.circle.fill" : score >= 5 ? "hand.thumbsup.circle.fill" : "book.circle.fill")
                .font(.system(size: 62))
                .foregroundStyle(AppTheme.violet)
                .padding(.top, 16)

            Text("\(score) / \(questions.count)")
                .font(.system(size: 44, weight: .heavy, design: .rounded))
                .contentTransition(.numericText())

            Text(resultHeadline)
                .font(.headline)
            Text(games.triviaHighScore == score && score > 0 ? "That's a new personal best!" : "Best so far: \(games.triviaHighScore)")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            VStack(spacing: 10) {
                PrimaryButton(title: "Play Again", systemImage: "arrow.clockwise", tint: AppTheme.violet) {
                    startRound()
                }
            }
            .padding(.top, 4)
        }
    }

    private var resultHeadline: String {
        switch score {
        case 9...: return "Highway expert!"
        case 7...8: return "Great road knowledge"
        case 4...6: return "Not bad — keep driving"
        default: return "Room to grow"
        }
    }

    // MARK: - Flow

    private func startRound() {
        questions = TriviaCatalog.round()
        index = 0
        score = 0
        selectedOption = nil
        hasRecorded = false
        phase = .playing
    }

    private func advance() {
        if index == questions.count - 1 {
            if !hasRecorded {
                games.recordTrivia(score: score, questionCount: questions.count)
                hasRecorded = true
            }
            phase = .finished
        } else {
            index += 1
            selectedOption = nil
        }
    }
}
