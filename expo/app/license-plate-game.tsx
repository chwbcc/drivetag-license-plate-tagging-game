import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { MapPin, Trophy, RotateCcw, ChevronLeft } from 'lucide-react-native';
import { Stack, router } from 'expo-router';
import Colors from '@/constants/colors';
import { useLicensePlateGame } from '@/store/license-plate-game-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';

export default function LicensePlateGameScreen() {
  const { isDark } = useTheme();
  const {
    states,
    spottedPlates,
    spotPlate,
    unspotPlate,
    resetGame,
    isPlateSpotted,
    getSpottedCount,
    getProgress,
    totalStates,
  } = useLicensePlateGame();

  const handlePlateToggle = (stateCode: string) => {
    if (isPlateSpotted(stateCode)) {
      unspotPlate(stateCode);
    } else {
      spotPlate(stateCode);
    }
  };

  const handleResetGame = () => {
    Alert.alert(
      'Reset Game',
      'Are you sure you want to reset all spotted plates? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: resetGame
        }
      ]
    );
  };

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: "License Plate Spotter",
          headerStyle: {
            backgroundColor: bgColor,
          },
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
          <Text style={[styles.title, { color: textColor }]}>License Plate Spotter</Text>
          <TouchableOpacity onPress={handleResetGame} style={[styles.resetButton, { backgroundColor: cardColor, borderColor }]}>
            <RotateCcw size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statsCard, { backgroundColor: cardColor }]}>
          <View style={styles.statItem}>
            <MapPin size={24} color={Colors.primary} />
            <Text style={[styles.statValue, { color: textColor }]}>{getSpottedCount()}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>States Spotted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Trophy size={24} color={Colors.success} />
            <Text style={[styles.statValue, { color: textColor }]}>{getProgress().toFixed(0)}%</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Completed</Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${getProgress()}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: textSecondary }]}>
            {getSpottedCount()} of {totalStates} states
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: textColor }]}>State License Plates</Text>
        <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
          Tap a state when you spot its license plate while traveling
        </Text>
        <View style={styles.statesGrid}>
          {states.map((state) => {
            const isSpotted = isPlateSpotted(state.code);
            const spotData = spottedPlates[state.code];
            
            return (
              <TouchableOpacity
                key={state.code}
                style={[
                  styles.stateCard,
                  { backgroundColor: cardColor, borderColor },
                  isSpotted && styles.stateCardSpotted,
                ]}
                onPress={() => handlePlateToggle(state.code)}
                activeOpacity={0.7}
              >
                <View style={styles.stateCardContent}>
                  <Text style={[
                    styles.stateCode,
                    { color: isSpotted ? '#fff' : textColor }
                  ]}>
                    {state.code}
                  </Text>
                  <Text style={[
                    styles.stateName,
                    { color: isSpotted ? '#fff' : textSecondary }
                  ]} numberOfLines={1}>
                    {state.name}
                  </Text>
                  {isSpotted && spotData && (
                    <View style={styles.checkmarkContainer}>
                      <Text style={styles.checkmark}>✓</Text>
                      {spotData.count > 1 && (
                        <View style={styles.countBadge}>
                          <Text style={styles.countText}>{spotData.count}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    flex: 1,
  },
  resetButton: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: 14,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 5,
  },
  progressText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  statesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  stateCard: {
    width: '31%',
    borderRadius: 10,
    padding: 8,
    borderWidth: 2,
    minHeight: 68,
  },
  stateCardSpotted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stateCardContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateCode: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 2,
  },
  stateName: {
    fontSize: 9,
    textAlign: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: 'bold' as const,
  },
  countBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold' as const,
  },
});
