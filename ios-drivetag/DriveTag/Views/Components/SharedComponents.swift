import SwiftUI

// MARK: - Cards

/// Rounded surface used for nearly every grouped block in the app.
struct CardContainer<Content: View>: View {
    var padding: CGFloat = 14
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.appCard, in: .rect(cornerRadius: 16))
    }
}

/// Small uppercase label that introduces a section.
struct SectionLabel: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(.caption.weight(.bold))
            .kerning(1.2)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Stats

/// A single number + caption, used in the profile header triad.
struct StatPillar: View {
    let value: String
    let label: String
    let tint: Color

    var body: some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(tint)
                .contentTransition(.numericText())
            Text(label.uppercased())
                .font(.caption2)
                .kerning(1)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

/// Circular progress gauge mirroring the RN `CircularGauge`.
struct RingGauge: View {
    let value: Int
    let total: Int
    let label: String
    let tint: Color
    var size: CGFloat = 92

    private var fraction: Double {
        total > 0 ? min(1, Double(value) / Double(total)) : 0
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(tint.opacity(0.15), lineWidth: 9)
                Circle()
                    .trim(from: 0, to: fraction)
                    .stroke(tint, style: StrokeStyle(lineWidth: 9, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.smooth(duration: 0.6), value: fraction)
                VStack(spacing: 0) {
                    Text("\(value)")
                        .font(.title2.weight(.bold))
                        .foregroundStyle(tint)
                        .contentTransition(.numericText())
                    if total > 0 {
                        Text("of \(total)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .frame(width: size, height: size)

            Text(label)
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
        }
    }
}

/// Level progress bar with an animated fill.
struct ExperienceBar: View {
    let exp: Int
    let level: Int

    private var progress: Levels.Progress { Levels.progress(exp: exp, level: level) }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Level \(level)", systemImage: "star.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AppTheme.accentYellow)
                Spacer()
                if progress.isMaxLevel {
                    Text("MAX LEVEL")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(AppTheme.accentYellow)
                } else {
                    Text("\(progress.current) / \(progress.needed) XP")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.secondary)
                        .contentTransition(.numericText())
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.primary.opacity(0.1))
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [AppTheme.primary, AppTheme.accentGreen],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: max(6, geo.size.width * progress.fraction))
                        .animation(.smooth(duration: 0.7), value: progress.fraction)
                }
            }
            .frame(height: 9)

            if !progress.isMaxLevel {
                Text("\(progress.needed - progress.current) XP to level \(level + 1)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

// MARK: - Buttons

/// Filled call-to-action button with a press animation.
struct PrimaryButton: View {
    let title: String
    var systemImage: String?
    var tint: Color = AppTheme.primary
    var isLoading: Bool = false
    var isEnabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
                    .font(.body.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: 50)
            .foregroundStyle(.white)
            .background(tint.opacity(isEnabled ? 1 : 0.4), in: .rect(cornerRadius: 14))
        }
        .buttonStyle(.pressable)
        .disabled(!isEnabled || isLoading)
    }
}

/// Bordered secondary action.
struct SecondaryButton: View {
    let title: String
    var systemImage: String?
    var tint: Color = AppTheme.primary
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage { Image(systemName: systemImage) }
                Text(title).font(.body.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: 48)
            .foregroundStyle(tint)
            .background(tint.opacity(0.12), in: .rect(cornerRadius: 14))
        }
        .buttonStyle(.pressable)
    }
}

/// Scale-and-fade feedback shared by custom buttons.
struct PressableButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .opacity(configuration.isPressed ? 0.9 : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PressableButtonStyle {
    static var pressable: PressableButtonStyle { PressableButtonStyle() }
}

// MARK: - Form fields

/// Labeled text field matching the RN `Input` component.
struct LabeledField: View {
    let label: String
    var placeholder: String = ""
    @Binding var text: String
    var isSecure: Bool = false
    var keyboard: UIKeyboardType = .default
    var autocapitalization: TextInputAutocapitalization = .sentences
    var contentType: UITextContentType?

    @State private var isRevealed: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.secondary)

            HStack {
                Group {
                    if isSecure && !isRevealed {
                        SecureField(placeholder, text: $text)
                    } else {
                        TextField(placeholder, text: $text)
                    }
                }
                .keyboardType(keyboard)
                .textInputAutocapitalization(autocapitalization)
                .autocorrectionDisabled()
                .textContentType(contentType)

                if isSecure {
                    Button {
                        isRevealed.toggle()
                    } label: {
                        Image(systemName: isRevealed ? "eye.slash" : "eye")
                            .foregroundStyle(.secondary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 14)
            .frame(minHeight: 50)
            .background(Color.appCard, in: .rect(cornerRadius: 12))
            .overlay {
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.primary.opacity(0.08), lineWidth: 1)
            }
        }
    }
}

// MARK: - Feedback

/// Inline error banner.
struct ErrorBanner: View {
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "exclamationmark.triangle.fill")
            Text(message)
                .font(.subheadline)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .foregroundStyle(AppTheme.error)
        .padding(12)
        .background(AppTheme.error.opacity(0.1), in: .rect(cornerRadius: 12))
        .transition(.move(edge: .top).combined(with: .opacity))
    }
}

/// Empty-state placeholder with an icon and guidance.
struct EmptyStateView: View {
    let systemImage: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 44))
                .foregroundStyle(.tertiary)
            Text(title)
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .padding(.horizontal, 24)
    }
}

// MARK: - Badges

/// Badge tile showing lock state and rarity.
struct BadgeTile: View {
    let badge: Badge
    let isEarned: Bool

    var body: some View {
        VStack(spacing: 8) {
            Text(badge.icon)
                .font(.system(size: 34))
                .opacity(isEarned ? 1 : 0.28)
                .grayscale(isEarned ? 0 : 1)

            Text(badge.name)
                .font(.caption.weight(.semibold))
                .multilineTextAlignment(.center)
                .lineLimit(2)
                .minimumScaleFactor(0.85)
                .foregroundStyle(isEarned ? .primary : .secondary)

            Text(badge.rarity.label.uppercased())
                .font(.system(size: 9, weight: .bold))
                .kerning(0.8)
                .foregroundStyle(isEarned ? AppTheme.rarityColor(badge.rarity) : .secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .padding(.horizontal, 8)
        .background(Color.appCard, in: .rect(cornerRadius: 14))
        .overlay {
            RoundedRectangle(cornerRadius: 14)
                .stroke(
                    isEarned ? AppTheme.rarityColor(badge.rarity).opacity(0.5) : Color.clear,
                    lineWidth: 1.5
                )
        }
        .overlay(alignment: .topTrailing) {
            if !isEarned {
                Image(systemName: "lock.fill")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .padding(8)
            }
        }
    }
}

// MARK: - Plate

/// Stylized US license plate rendering used across the app.
struct PlateBadge: View {
    let state: String
    let number: String
    var compact: Bool = false

    var body: some View {
        HStack(spacing: 6) {
            if !state.isEmpty {
                Text(state)
                    .font(.system(size: compact ? 10 : 12, weight: .heavy, design: .rounded))
                    .foregroundStyle(AppTheme.primary)
            }
            Text(number.isEmpty ? "—" : number.uppercased())
                .font(.system(size: compact ? 13 : 17, weight: .bold, design: .monospaced))
                .kerning(1.5)
        }
        .padding(.horizontal, compact ? 8 : 12)
        .padding(.vertical, compact ? 4 : 7)
        .background(Color.appCard, in: .rect(cornerRadius: 7))
        .overlay {
            RoundedRectangle(cornerRadius: 7)
                .stroke(AppTheme.primary.opacity(0.45), lineWidth: 1.5)
        }
    }
}

// MARK: - Segmented chips

/// Horizontal filter chips with an animated selection pill.
struct ChipPicker<T: Hashable>: View {
    let options: [(value: T, label: String, systemImage: String?)]
    @Binding var selection: T
    var tint: Color = AppTheme.primary

    var body: some View {
        HStack(spacing: 4) {
            ForEach(options, id: \.value) { option in
                Button {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                        selection = option.value
                    }
                } label: {
                    HStack(spacing: 5) {
                        if let icon = option.systemImage {
                            Image(systemName: icon).font(.caption)
                        }
                        Text(option.label)
                            .font(.subheadline.weight(selection == option.value ? .semibold : .regular))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .foregroundStyle(selection == option.value ? tint : Color.secondary)
                    .background {
                        if selection == option.value {
                            RoundedRectangle(cornerRadius: 9).fill(tint.opacity(0.15))
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(Color.appCard, in: .rect(cornerRadius: 12))
    }
}
