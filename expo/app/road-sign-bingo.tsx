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
import { ChevronLeft, RotateCcw, Trophy, Hash } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useRoadSignBingo } from '@/store/road-sign-bingo-store';

export default function RoadSignBingoScreen() {
  const { isDark } = useTheme();
  const {
    signs,
    spottedSigns,
    spotSign,
    unspotSign,
    resetGame,
    getSpottedCount,
    getProgress,
    totalSigns,
  } = useRoadSignBingo();

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;

  const handleToggle = (signId: string) => {
    if (spottedSigns[signId]) {
      Alert.alert('Remove Sign', 'Remove this sign from spotted?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => unspotSign(signId) },
      ]);
    } else {
      spotSign(signId);
    }
  };

  const handleReset = () => {
    Alert.alert('Reset Game', 'Clear all spotted signs?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetGame },
    ]);
  };

  const categories = ['Regulatory', 'Warning', 'Guide'];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: 'Road Sign Bingo',
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
          <Text style={[styles.title, { color: textColor }]}>Road Sign Bingo</Text>
          <TouchableOpacity
            onPress={handleReset}
            style={[styles.resetButton, { backgroundColor: cardColor, borderColor }]}
          >
            <RotateCcw size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
          <View style={styles.statItem}>
            <Hash size={22} color="#F97316" />
            <Text style={[styles.statValue, { color: textColor }]}>{getSpottedCount()}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Spotted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Trophy size={22} color={Colors.success} />
            <Text style={[styles.statValue, { color: textColor }]}>{getProgress().toFixed(0)}%</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Complete</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
            <View style={[styles.progressBarFill, { width: `${getProgress()}%`, backgroundColor: '#F97316' }]} />
          </View>
          <Text style={[styles.progressText, { color: textSecondary }]}>
            {getSpottedCount()} of {totalSigns} signs
          </Text>
        </View>

        {categories.map((cat) => {
          const catSigns = signs.filter((s) => s.category === cat);
          return (
            <View key={cat} style={{ marginBottom: 16 }}>
              <Text style={[styles.categoryTitle, { color: textColor }]}>{cat}</Text>
              <View style={styles.signsGrid}>
                {catSigns.map((sign) => {
                  const isSpotted = !!spottedSigns[sign.id];
                  return (
                    <TouchableOpacity
                      key={sign.id}
                      style={[
                        styles.signCard,
                        { backgroundColor: cardColor, borderColor },
                        isSpotted && styles.signCardSpotted,
                      ]}
                      onPress={() => handleToggle(sign.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.signEmoji}>{sign.emoji}</Text>
                      <Text
                        style={[
                          styles.signName,
                          { color: isSpotted ? '#fff' : textColor },
                        ]}
                        numberOfLines={2}
                      >
                        {sign.name}
                      </Text>
                      {isSpotted && spottedSigns[sign.id].count > 1 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{spottedSigns[sign.id].count}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
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
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16 },
  statValue: { fontSize: 24, fontWeight: 'bold' as const, marginTop: 4 },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' as const },
  progressBarContainer: { marginBottom: 16 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' as const },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 11, textAlign: 'center' as const, marginTop: 6 },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  signsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  signCard: {
    width: '31%',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    minHeight: 90,
    justifyContent: 'center' as const,
  },
  signCardSpotted: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  signEmoji: { fontSize: 26, marginBottom: 4 },
  signName: { fontSize: 10, textAlign: 'center' as const, fontWeight: '600' as const },
  countBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 4,
  },
  countText: { fontSize: 10, fontWeight: 'bold' as const, color: '#F97316' },
});
