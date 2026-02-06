import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { MapPin, Car, Gamepad2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useLicensePlateGame } from '@/store/license-plate-game-store';
import { useCarSpotterGame } from '@/store/car-spotter-game-store';

export default function GamesScreen() {
  const { isDark } = useTheme();
  const { getSpottedCount, totalStates } = useLicensePlateGame();
  const { getSpottedCount: getCarSpottedCount, totalCars } = useCarSpotterGame();

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: "Let's Play",
          headerStyle: {
            backgroundColor: bgColor,
          },
          headerTintColor: textColor,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Gamepad2 size={48} color={Colors.primary} />
          <Text style={[styles.title, { color: textColor }]}>Passenger Games</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            Fun games to play while on the road
          </Text>
        </View>

        <View style={styles.gamesContainer}>
          <TouchableOpacity
            style={[styles.gameCard, { backgroundColor: cardColor }]}
            onPress={() => router.push('/license-plate-game' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.gameIconContainer, { backgroundColor: Colors.primary + '20' }]}>
              <MapPin size={32} color={Colors.primary} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={[styles.gameName, { color: textColor }]}>License Plate Spotter</Text>
              <Text style={[styles.gameDescription, { color: textSecondary }]}>
                Spot all 50 US state license plates while traveling
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(getSpottedCount() / totalStates) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: textSecondary }]}>
                  {getSpottedCount()}/{totalStates} spotted
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameCard, { backgroundColor: cardColor }]}
            onPress={() => router.push('/car-spotter-game' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.gameIconContainer, { backgroundColor: Colors.success + '20' }]}>
              <Car size={32} color={Colors.success} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={[styles.gameName, { color: textColor }]}>Car Spotter</Text>
              <Text style={[styles.gameDescription, { color: textSecondary }]}>
                Identify and spot different car makes, models, and years
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${(getCarSpottedCount() / totalCars) * 100}%`,
                        backgroundColor: Colors.success 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: textSecondary }]}>
                  {getCarSpottedCount()}/{totalCars} spotted
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.tipCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.tipTitle, { color: textColor }]}>Safety First! 🚗</Text>
          <Text style={[styles.tipText, { color: textSecondary }]}>
            These games are designed for passengers only. Drivers should keep their eyes on the road at all times.
          </Text>
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
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    marginTop: 12,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: '80%',
  },
  gamesContainer: {
    gap: 16,
    marginBottom: 20,
  },
  gameCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  gameInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  tipCard: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
