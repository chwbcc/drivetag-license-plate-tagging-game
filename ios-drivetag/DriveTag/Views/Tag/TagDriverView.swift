import SwiftUI

/// Submits a positive or negative tag against another driver's plate.
struct TagDriverView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.dismiss) private var dismiss

    @State private var location = LocationService()

    @State private var pelletType: PelletType = .negative
    @State private var plate: String = ""
    @State private var state: String = ""
    @State private var reason: String = ""
    @State private var customReason: String = ""
    @State private var errorMessage: String?
    @State private var isSubmitting: Bool = false
    @State private var successMessage: String?
    @State private var newBadgeCount: Int = 0

    private var user: AppUser { auth.user ?? .placeholder }
    private var isPositive: Bool { pelletType == .positive }
    private var tint: Color { isPositive ? AppTheme.success : AppTheme.error }

    private var availablePellets: Int {
        isPositive ? user.positivePelletCount : user.pelletCount
    }

    /// The reason actually submitted — "Other" swaps in the free-text field.
    private var resolvedReason: String {
        reason == "Other" ? customReason.trimmingCharacters(in: .whitespacesAndNewlines) : reason
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    typeSelector
                    inventoryBanner

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    plateSection
                    reasonSection
                    locationSection

                    PrimaryButton(
                        title: isPositive ? "Send Praise" : "Tag Driver",
                        systemImage: isPositive ? "hand.thumbsup.fill" : "hand.thumbsdown.fill",
                        tint: tint,
                        isLoading: isSubmitting,
                        isEnabled: availablePellets > 0
                    ) {
                        submit()
                    }

                    expNote
                }
                .padding(16)
            }
            .background(Color.appBackground)
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("Tag a Driver")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .animation(.smooth(duration: 0.25), value: pelletType)
            .task { location.request() }
            .alert("Success", isPresented: .constant(successMessage != nil)) {
                Button("OK") {
                    successMessage = nil
                    dismiss()
                }
            } message: {
                Text(successMessage ?? "")
            }
        }
    }

    // MARK: - Sections

    private var typeSelector: some View {
        HStack(spacing: 10) {
            typeCard(.negative, title: "Negative", subtitle: "Report bad driving", systemImage: "hand.thumbsdown.fill", color: AppTheme.error)
            typeCard(.positive, title: "Positive", subtitle: "Praise good driving", systemImage: "hand.thumbsup.fill", color: AppTheme.success)
        }
    }

    private func typeCard(_ type: PelletType, title: String, subtitle: String, systemImage: String, color: Color) -> some View {
        let isSelected = pelletType == type
        return Button {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                pelletType = type
                reason = ""
                customReason = ""
                errorMessage = nil
            }
        } label: {
            VStack(spacing: 7) {
                Image(systemName: systemImage)
                    .font(.system(size: 22))
                    .foregroundStyle(isSelected ? .white : color)
                Text(title)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(isSelected ? .white : .primary)
                Text(subtitle)
                    .font(.caption2)
                    .foregroundStyle(isSelected ? .white.opacity(0.85) : .secondary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(isSelected ? color : Color.appCard, in: .rect(cornerRadius: 16))
            .overlay {
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? .clear : color.opacity(0.25), lineWidth: 1.5)
            }
        }
        .buttonStyle(.pressable)
    }

    private var inventoryBanner: some View {
        HStack(spacing: 10) {
            Image(systemName: "circle.grid.2x2.fill")
                .foregroundStyle(tint)
            Text(availablePellets > 0
                 ? "\(availablePellets) \(isPositive ? "positive" : "negative") pellet\(availablePellets == 1 ? "" : "s") available"
                 : "No \(isPositive ? "positive" : "negative") pellets left — buy more in the Shop")
                .font(.subheadline.weight(.medium))
                .foregroundStyle(availablePellets > 0 ? .primary : AppTheme.error)
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(tint.opacity(0.1), in: .rect(cornerRadius: 12))
    }

    private var plateSection: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "Their Plate")

                HStack(spacing: 10) {
                    Menu {
                        Picker("State", selection: $state) {
                            Text("State").tag("")
                            ForEach(USStates.all, id: \.self) { Text($0).tag($0) }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(state.isEmpty ? "ST" : state)
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(state.isEmpty ? .secondary : .primary)
                            Image(systemName: "chevron.down").font(.caption2).foregroundStyle(.secondary)
                        }
                        .frame(width: 74, height: 50)
                        .background(Color.appBackground, in: .rect(cornerRadius: 12))
                    }

                    TextField("ABC1234", text: $plate)
                        .font(.system(size: 19, weight: .bold, design: .monospaced))
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(Color.appBackground, in: .rect(cornerRadius: 12))
                        .onChange(of: plate) { _, newValue in
                            plate = String(newValue.uppercased().prefix(8))
                        }
                }

                if !state.isEmpty || !plate.isEmpty {
                    HStack {
                        Text("Preview")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        PlateBadge(state: state, number: plate)
                    }
                }
            }
        }
    }

    private var reasonSection: some View {
        CardContainer {
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "Reason")

                LazyVGrid(columns: Array(repeating: GridItem(spacing: 8), count: 2), spacing: 8) {
                    ForEach(TagReasons.list(for: pelletType), id: \.self) { option in
                        Button {
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                                reason = option
                            }
                        } label: {
                            Text(option)
                                .font(.caption.weight(reason == option ? .semibold : .regular))
                                .multilineTextAlignment(.leading)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 10)
                                .foregroundStyle(reason == option ? tint : .primary)
                                .background(
                                    reason == option ? tint.opacity(0.15) : Color.appBackground,
                                    in: .rect(cornerRadius: 10)
                                )
                                .overlay {
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(reason == option ? tint.opacity(0.5) : .clear, lineWidth: 1.5)
                                }
                        }
                        .buttonStyle(.plain)
                    }
                }

                if reason == "Other" {
                    TextField("Describe what happened", text: $customReason, axis: .vertical)
                        .font(.subheadline)
                        .lineLimit(2...4)
                        .padding(12)
                        .background(Color.appBackground, in: .rect(cornerRadius: 10))
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
        }
    }

    private var locationSection: some View {
        CardContainer {
            HStack(spacing: 10) {
                Image(systemName: location.hasLocation ? "location.fill" : "location.slash")
                    .foregroundStyle(location.hasLocation ? AppTheme.primary : .secondary)
                    .frame(width: 32, height: 32)
                    .background(
                        (location.hasLocation ? AppTheme.primary : Color.gray).opacity(0.14),
                        in: .rect(cornerRadius: 9)
                    )

                VStack(alignment: .leading, spacing: 2) {
                    Text(location.hasLocation ? "Location attached" : "Location unavailable")
                        .font(.subheadline.weight(.medium))
                    Text(location.hasLocation
                         ? "+\(ExpRewards.locationBonus) XP bonus"
                         : location.isDenied ? "Enable location in Settings for bonus XP" : "Tap to attach for bonus XP")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 0)

                if location.isRequesting {
                    ProgressView()
                } else if !location.hasLocation && !location.isDenied {
                    Button("Attach") { location.request() }
                        .font(.caption.weight(.semibold))
                        .buttonStyle(.borderless)
                }
            }
        }
    }

    private var expNote: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("EXPERIENCE")
                .font(.system(size: 10, weight: .bold))
                .kerning(1)
                .foregroundStyle(.secondary)
            Text("Base \(isPositive ? ExpRewards.positiveTag : ExpRewards.tagDriver) XP • +\(ExpRewards.locationBonus) XP with location • +\(ExpRewards.detailedReasonBonus) XP for a detailed reason")
                .font(.caption)
                .foregroundStyle(.secondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 4)
    }

    // MARK: - Submit

    private func submit() {
        errorMessage = nil

        guard !state.isEmpty else {
            errorMessage = "Please select a state"
            return
        }
        guard (3...8).contains(plate.count) else {
            errorMessage = "Please enter a valid license plate number"
            return
        }
        guard !resolvedReason.isEmpty else {
            errorMessage = reason.isEmpty ? "Please provide a reason" : "Please describe what happened"
            return
        }

        let fullPlate = "\(state)-\(plate.uppercased())"
        guard fullPlate.lowercased() != user.fullPlate.lowercased() else {
            errorMessage = "You can't tag your own vehicle"
            return
        }
        guard availablePellets > 0 else {
            errorMessage = "You don't have any \(isPositive ? "positive" : "negative") pellets left. Purchase more in the shop."
            return
        }

        isSubmitting = true
        Task {
            do {
                let result = try await TagSubmitter.submit(
                    user: user,
                    fullPlate: fullPlate,
                    reason: resolvedReason,
                    type: pelletType,
                    coordinate: location.coordinate
                )

                // Reflect the spend and rewards locally so the UI updates instantly.
                auth.applyLocal { current in
                    if isPositive {
                        current.positivePelletCount = max(0, current.positivePelletCount - 1)
                        current.positivePelletsGivenCount += 1
                    } else {
                        current.pelletCount = max(0, current.pelletCount - 1)
                        current.negativePelletsGivenCount += 1
                    }
                    current.pelletsGivenCount += 1
                    current.exp = result.newExp
                    current.level = result.newLevel
                }

                let earned = await auth.awardBadges(counts: BadgeCounts(user: auth.user ?? user))
                newBadgeCount = earned.count

                var message = "Driver \(pelletType.verb) successfully!\n\n+\(result.expGained) EXP"
                if result.leveledUp { message += "\n\nLevel Up! You're now level \(result.newLevel)." }
                if !earned.isEmpty { message += "\n\n\(earned.count) new badge\(earned.count == 1 ? "" : "s") earned!" }
                successMessage = message
            } catch {
                errorMessage = error.localizedDescription
            }
            isSubmitting = false
        }
    }
}
