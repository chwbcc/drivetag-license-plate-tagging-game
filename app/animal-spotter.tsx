import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, RotateCcw, Trophy, Star, Hash } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useAnimalSpotter } from '@/store/animal-spotter-store';

export default function AnimalSpotterScreen() {
  const { isDark } = useTheme();
  const {
    animals,
    spottedAnimals,
    spotAnimal,
    unspotAnimal,
    resetGame,
    getSpottedCount,
    getProgress,
    getTotalPoints,
    totalAnimals,
  } = useAnimalSpotter();

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;

  const handleToggle = (animalId: string) => {
    if (spottedAnimals[animalId]) {
      Alert.alert('Options', 'What would you like to do?', [
        { text: 'Spot Again (+1)', onPress: () => spotAnimal(animalId) },
        { text: 'Remove', style: 'destructive', onPress: () => unspotAnimal(animalId) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      spotAnimal(animalId);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Game', 'Clear all spotted animals?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetGame },
    ]);
  };

  const categories = ['Farm', 'Birds', 'Wild', 'Pets'];
  const categoryColors: Record<string, string> = {
    Farm: '#10B981',
    Birds: '#3B82F6',
    Wild: '#F97316',
    Pets: '#EC4899',
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: 'Animal Spotter',
          headerStyle: { backgroundColor: bgColor },
          headerTintColor: textColor,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ChevronLeft size={28} color={textColor} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Animal Spotter</Text>
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.resetButton, { backgroundColor: cardColor, borderColor }]}
          >
            <RotateCcw size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
          <View style={styles.statItem}>
            <Hash size={20} color="#10B981" />
            <Text style={[styles.statValue, { color: textColor }]}>{getSpottedCount()}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Species</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Star size={20} color="#FFD700" />
            <Text style={[styles.statValue, { color: textColor }]}>{getTotalPoints()}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Trophy size={20} color={Colors.primary} />
            <Text style={[styles.statValue, { color: textColor }]}>{getProgress().toFixed(0)}%</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Complete</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
            <View style={[styles.progressBarFill, { width: `${getProgress()}%`, backgroundColor: '#10B981' }]} />
          </View>
          <Text style={[styles.progressText, { color: textSecondary }]}>
            {getSpottedCount()} of {totalAnimals} species spotted
          </Text>
        </View>

        {categories.map((cat) => {
          const catAnimals = animals.filter((a) => a.category === cat);
          const catColor = categoryColors[cat] ?? Colors.primary;
          return (
            <View key={cat} style={{ marginBottom: 16 }}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                <Text style={[styles.categoryTitle, { color: textColor }]}>{cat}</Text>
              </View>
              <View style={styles.animalsGrid}>
                {catAnimals.map((animal) => {
                  const isSpotted = !!spottedAnimals[animal.id];
                  const spotted = spottedAnimals[animal.id];
                  return (
                    <TouchableOpacity
                      key={animal.id}
                      style={[
                        styles.animalCard,
                        { backgroundColor: cardColor, borderColor },
                        isSpotted && { backgroundColor: catColor, borderColor: catColor },
                      ]}
                      onPress={() => handleToggle(animal.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                      <Text
                        style={[styles.animalName, { color: isSpotted ? '#fff' : textColor }]}
                        numberOfLines={1}
                      >
                        {animal.name}
                      </Text>
                      <View style={[styles.pointsPill, { backgroundColor: isSpotted ? 'rgba(255,255,255,0.25)' : (isDark ? '#2a2a3e' : '#f0f0f5') }]}>
                        <Text style={[styles.pointsText, { color: isSpotted ? '#fff' : textSecondary }]}>
                          {animal.points} pt{animal.points !== 1 ? 's' : ''}
                        </Text>
                      </View>
                      {isSpotted && spotted && spotted.count > 1 && (
                        <View style={styles.countBadge}>
                          <Text style={[styles.countText, { color: catColor }]}>x{spotted.count}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={[styles.tipCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.tipTitle, { color: textColor }]}>Scoring</Text>
          <Text style={[styles.tipText, { color: textSecondary }]}>
            Rarer animals earn more points! Farm animals are 1-3 pts, while bears and moose are worth 10 pts each. Tap a spotted animal to log another sighting for bonus points.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: 'bold' as const, flex: 1 },
  resetButton: { padding: 10, borderRadius: 10, borderWidth: 1 },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center' as const },
  statDivider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold' as const, marginTop: 4 },
  statLabel: { fontSize: 10, marginTop: 2, textAlign: 'center' as const },
  progressBarContainer: { marginBottom: 16 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' as const },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 11, textAlign: 'center' as const, marginTop: 6 },
  categoryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 10,
    gap: 8,
  },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  animalsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  animalCard: {
    width: '31%',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    minHeight: 100,
    justifyContent: 'center' as const,
  },
  animalEmoji: { fontSize: 28, marginBottom: 4 },
  animalName: { fontSize: 10, textAlign: 'center' as const, fontWeight: '600' as const, marginBottom: 4 },
  pointsPill: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pointsText: { fontSize: 9, fontWeight: '700' as const },
  countBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 22,
    height: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 4,
  },
  countText: { fontSize: 10, fontWeight: 'bold' as const },
  tipCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    marginTop: 8,
  },
  tipTitle: { fontSize: 15, fontWeight: 'bold' as const, marginBottom: 6 },
  tipText: { fontSize: 13, lineHeight: 20 },
});
