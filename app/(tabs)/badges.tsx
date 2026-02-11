import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import {
  MapPin,
  Car,
  Signpost,
  Brain,
  PawPrint,
  Palette,
  ChevronRight,
  Gamepad2,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useLicensePlateGame } from '@/store/license-plate-game-store';
import { useCarSpotterGame } from '@/store/car-spotter-game-store';
import { useRoadSignBingo } from '@/store/road-sign-bingo-store';
import { useAnimalSpotter } from '@/store/animal-spotter-store';
import { useTrivia } from '@/store/trivia-store';
import { useColorCar } from '@/store/color-car-store';

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
  onPress: () => void;
  stat?: string;
  statLabel?: string;
  progress?: number;
  cardColor: string;
  textColor: string;
  textSecondary: string;
  isDark: boolean;
}

function GameCard({
  title,
  description,
  icon,
  iconBg,
  accentColor,
  onPress,
  stat,
  statLabel,
  progress,
  cardColor,
  textColor,
  textSecondary,
  isDark,
}: GameCardProps) {
  return (
    <TouchableOpacity
      style={[styles.gameCard, { backgroundColor: cardColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.gameCardTop}>
        <View style={[styles.gameIconContainer, { backgroundColor: iconBg }]}>
          {icon}
        </View>
        <View style={styles.gameCardMeta}>
          {stat !== undefined && (
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: accentColor }]}>{stat}</Text>
              {statLabel && (
                <Text style={[styles.statLabel, { color: textSecondary }]}>{statLabel}</Text>
              )}
            </View>
          )}
          <ChevronRight size={18} color={textSecondary} />
        </View>
      </View>
      <Text style={[styles.gameName, { color: textColor }]}>{title}</Text>
      <Text style={[styles.gameDescription, { color: textSecondary }]}>{description}</Text>
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#e8e8ee' }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, progress)}%`, backgroundColor: accentColor },
              ]}
            />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function GamesScreen() {
  const { isDark } = useTheme();
  const { getSpottedCount, totalStates } = useLicensePlateGame();
  const { getSpottedCount: getCarSpottedCount, totalCars } = useCarSpotterGame();
  const { getSpottedCount: getSignCount, totalSigns } = useRoadSignBingo();
  const { getSpottedCount: getAnimalCount, getTotalPoints, totalAnimals } = useAnimalSpotter();
  const { highScore: triviaHigh, accuracy: triviaAccuracy } = useTrivia();
  const { highScore: colorHigh, gamesPlayed: colorGames } = useColorCar();

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;

  const spotterGames = [
    {
      title: 'License Plate Spotter',
      description: 'Spot all 50 US state license plates',
      icon: <MapPin size={28} color={Colors.primary} />,
      iconBg: Colors.primary + '18',
      accentColor: Colors.primary,
      route: '/license-plate-game',
      stat: `${getSpottedCount()}/${totalStates}`,
      statLabel: 'spotted',
      progress: (getSpottedCount() / totalStates) * 100,
    },
    {
      title: 'Car Spotter',
      description: 'Identify car makes, models & years',
      icon: <Car size={28} color={Colors.success} />,
      iconBg: Colors.success + '18',
      accentColor: Colors.success,
      route: '/car-spotter-game',
      stat: `${getCarSpottedCount()}`,
      statLabel: 'cars',
      progress: (getCarSpottedCount() / totalCars) * 100,
    },
    {
      title: 'Road Sign Bingo',
      description: 'Spot road signs from stop to interstate',
      icon: <Signpost size={28} color="#F97316" />,
      iconBg: '#F9731618',
      accentColor: '#F97316',
      route: '/road-sign-bingo',
      stat: `${getSignCount()}/${totalSigns}`,
      statLabel: 'signs',
      progress: (getSignCount() / totalSigns) * 100,
    },
    {
      title: 'Animal Spotter',
      description: 'Spot animals along the road for points',
      icon: <PawPrint size={28} color="#10B981" />,
      iconBg: '#10B98118',
      accentColor: '#10B981',
      route: '/animal-spotter',
      stat: `${getTotalPoints()}`,
      statLabel: 'pts',
      progress: (getAnimalCount() / totalAnimals) * 100,
    },
  ];

  const challengeGames = [
    {
      title: 'Road Trip Trivia',
      description: 'Test your knowledge of US geography & roads',
      icon: <Brain size={28} color="#8B5CF6" />,
      iconBg: '#8B5CF618',
      accentColor: '#8B5CF6',
      route: '/trivia-game',
      stat: triviaHigh > 0 ? `${triviaHigh}/10` : '--',
      statLabel: 'best',
      progress: undefined,
    },
    {
      title: 'Color Car Count',
      description: 'Pick a color and count cars in 60 seconds',
      icon: <Palette size={28} color="#EC4899" />,
      iconBg: '#EC489918',
      accentColor: '#EC4899',
      route: '/color-car-game',
      stat: colorHigh > 0 ? `${colorHigh}` : '--',
      statLabel: 'best',
      progress: undefined,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: "Let's Play",
          headerStyle: { backgroundColor: bgColor },
          headerTintColor: textColor,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: isDark ? '#24243a' : '#EEF2FF' }]}>
            <Gamepad2 size={32} color={Colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: textColor }]}>Passenger Games</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>
              Fun games to play on the road
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: textSecondary }]}>SPOTTER GAMES</Text>
        <View style={styles.gamesGrid}>
          {spotterGames.map((game) => (
            <GameCard
              key={game.route}
              title={game.title}
              description={game.description}
              icon={game.icon}
              iconBg={game.iconBg}
              accentColor={game.accentColor}
              onPress={() => router.push(game.route as any)}
              stat={game.stat}
              statLabel={game.statLabel}
              progress={game.progress}
              cardColor={cardColor}
              textColor={textColor}
              textSecondary={textSecondary}
              isDark={isDark}
            />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: textSecondary }]}>CHALLENGE GAMES</Text>
        <View style={styles.gamesGrid}>
          {challengeGames.map((game) => (
            <GameCard
              key={game.route}
              title={game.title}
              description={game.description}
              icon={game.icon}
              iconBg={game.iconBg}
              accentColor={game.accentColor}
              onPress={() => router.push(game.route as any)}
              stat={game.stat}
              statLabel={game.statLabel}
              progress={game.progress}
              cardColor={cardColor}
              textColor={textColor}
              textSecondary={textSecondary}
              isDark={isDark}
            />
          ))}
        </View>

        <View style={[styles.tipCard, { backgroundColor: isDark ? '#2a2a3e' : '#FFF7ED' }]}>
          <Text style={[styles.tipTitle, { color: isDark ? '#F97316' : '#C2410C' }]}>
            Passengers Only
          </Text>
          <Text style={[styles.tipText, { color: textSecondary }]}>
            These games are designed for passengers. Drivers should always keep their eyes on the road.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800' as const },
  subtitle: { fontSize: 14, marginTop: 2 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 4,
  },
  gamesGrid: { gap: 10, marginBottom: 20 },
  gameCard: {
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  gameCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  statValue: { fontSize: 16, fontWeight: '800' as const },
  statLabel: { fontSize: 11 },
  gameName: { fontSize: 16, fontWeight: '700' as const, marginBottom: 3 },
  gameDescription: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  progressContainer: { marginTop: 2 },
  progressBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  tipCard: {
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  tipTitle: { fontSize: 14, fontWeight: '700' as const, marginBottom: 4 },
  tipText: { fontSize: 13, lineHeight: 19 },
});
