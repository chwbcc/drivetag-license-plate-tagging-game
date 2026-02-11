import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, Trophy, Timer, Plus, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useColorCar, ColorOption } from '@/store/color-car-store';

type GameState = 'select' | 'playing' | 'result';

const GAME_DURATION = 60;

export default function ColorCarGameScreen() {
  const { isDark } = useTheme();
  const { colors, highScore, gamesPlayed, recordGame, resetStats } = useColorCar();

  const [gameState, setGameState] = useState<GameState>('select');
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countAnim = useRef(new Animated.Value(1)).current;

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = useCallback((color: ColorOption) => {
    setSelectedColor(color);
    setCount(0);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setGameState('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (gameState === 'result' && selectedColor) {
      recordGame(count);
    }
  }, [gameState]);

  const handleTap = useCallback(() => {
    setCount((prev) => prev + 1);
    Animated.sequence([
      Animated.timing(countAnim, { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.timing(countAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 50, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [countAnim, pulseAnim]);

  const handleEndEarly = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setGameState('result');
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 10) return '#EF4444';
    if (timeLeft <= 30) return '#F59E0B';
    return Colors.success;
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: 'Color Car Count',
          headerStyle: { backgroundColor: bgColor },
          headerTintColor: textColor,
          headerLeft: () => (
            <TouchableOpacity onPress={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              router.back();
            }} style={{ marginLeft: 8 }}>
              <ChevronLeft size={28} color={textColor} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {gameState === 'select' && (
          <View style={styles.selectContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#EC489920' }]}>
              <Timer size={48} color="#EC4899" />
            </View>
            <Text style={[styles.selectTitle, { color: textColor }]}>Color Car Count</Text>
            <Text style={[styles.selectSubtitle, { color: textSecondary }]}>
              Pick a car color, then tap every time you spot one! You have 60 seconds.
            </Text>

            <View style={[styles.statsRow, { backgroundColor: cardColor }]}>
              <View style={styles.selectStatItem}>
                <Text style={[styles.selectStatValue, { color: '#EC4899' }]}>{highScore}</Text>
                <Text style={[styles.selectStatLabel, { color: textSecondary }]}>Best</Text>
              </View>
              <View style={styles.selectStatDivider} />
              <View style={styles.selectStatItem}>
                <Text style={[styles.selectStatValue, { color: Colors.primary }]}>{gamesPlayed}</Text>
                <Text style={[styles.selectStatLabel, { color: textSecondary }]}>Games</Text>
              </View>
            </View>

            <Text style={[styles.pickLabel, { color: textColor }]}>Pick a Color</Text>
            <View style={styles.colorsGrid}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color.id}
                  style={[styles.colorOption]}
                  onPress={() => startGame(color)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: color.hex, borderColor: color.id === 'white' ? '#ccc' : color.hex }]} />
                  <Text style={[styles.colorName, { color: textColor }]}>{color.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {gamesPlayed > 0 && (
              <TouchableOpacity style={styles.resetLink} onPress={resetStats}>
                <RotateCcw size={14} color={textSecondary} />
                <Text style={[styles.resetLinkText, { color: textSecondary }]}>Reset Stats</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {gameState === 'playing' && selectedColor && (
          <View style={styles.playingContainer}>
            <View style={styles.timerRow}>
              <Timer size={20} color={getTimerColor()} />
              <Text style={[styles.timerText, { color: getTimerColor() }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>

            <View style={[styles.colorBanner, { backgroundColor: selectedColor.hex, borderColor: selectedColor.id === 'white' ? '#ccc' : selectedColor.hex }]}>
              <Text style={[styles.colorBannerText, { color: selectedColor.id === 'white' || selectedColor.id === 'yellow' ? '#333' : '#fff' }]}>
                Spotting: {selectedColor.name} Cars
              </Text>
            </View>

            <Animated.View style={[{ transform: [{ scale: countAnim }] }]}>
              <Text style={[styles.bigCount, { color: textColor }]}>{count}</Text>
              <Text style={[styles.countLabel, { color: textSecondary }]}>cars spotted</Text>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
              <TouchableOpacity
                style={[styles.tapButton, { backgroundColor: selectedColor.hex, borderColor: selectedColor.id === 'white' ? '#ccc' : selectedColor.hex }]}
                onPress={handleTap}
                activeOpacity={0.8}
              >
                <Plus size={40} color={selectedColor.id === 'white' || selectedColor.id === 'yellow' ? '#333' : '#fff'} strokeWidth={3} />
                <Text style={[styles.tapButtonText, { color: selectedColor.id === 'white' || selectedColor.id === 'yellow' ? '#333' : '#fff' }]}>
                  TAP TO COUNT
                </Text>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity style={[styles.endButton, { backgroundColor: cardColor }]} onPress={handleEndEarly}>
              <Text style={[styles.endButtonText, { color: textSecondary }]}>End Early</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'result' && selectedColor && (
          <View style={styles.resultContainer}>
            <View style={[styles.resultCard, { backgroundColor: cardColor }]}>
              <View style={[styles.resultColorSwatch, { backgroundColor: selectedColor.hex, borderColor: selectedColor.id === 'white' ? '#ccc' : selectedColor.hex }]} />
              <Trophy size={48} color="#FFD700" />
              <Text style={[styles.resultTitle, { color: textColor }]}>Time's Up!</Text>
              <Text style={[styles.resultCount, { color: selectedColor.id === 'white' ? Colors.primary : selectedColor.hex }]}>
                {count}
              </Text>
              <Text style={[styles.resultLabel, { color: textSecondary }]}>
                {selectedColor.name} cars in {GAME_DURATION - timeLeft} seconds
              </Text>
              {count >= highScore && count > 0 && (
                <View style={styles.newHighBadge}>
                  <Text style={styles.newHighText}>New High Score!</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.playAgainButton, { backgroundColor: selectedColor.hex, borderColor: selectedColor.id === 'white' ? '#ccc' : selectedColor.hex }]}
              onPress={() => startGame(selectedColor)}
            >
              <Text style={[styles.playAgainText, { color: selectedColor.id === 'white' || selectedColor.id === 'yellow' ? '#333' : '#fff' }]}>
                Play Again ({selectedColor.name})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.newColorButton, { backgroundColor: cardColor }]}
              onPress={() => setGameState('select')}
            >
              <Text style={[styles.newColorText, { color: textColor }]}>Choose Different Color</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  selectContainer: { alignItems: 'center' as const, paddingTop: 16 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center' as const, alignItems: 'center' as const, marginBottom: 16,
  },
  selectTitle: { fontSize: 26, fontWeight: 'bold' as const, marginBottom: 8 },
  selectSubtitle: { fontSize: 14, textAlign: 'center' as const, maxWidth: '85%', lineHeight: 20, marginBottom: 24 },
  statsRow: {
    flexDirection: 'row' as const, borderRadius: 14, padding: 16,
    width: '100%', marginBottom: 24,
  },
  selectStatItem: { flex: 1, alignItems: 'center' as const },
  selectStatValue: { fontSize: 22, fontWeight: 'bold' as const },
  selectStatLabel: { fontSize: 11, marginTop: 2 },
  selectStatDivider: { width: 1, backgroundColor: '#e0e0e0' },
  pickLabel: { fontSize: 16, fontWeight: '700' as const, marginBottom: 14, alignSelf: 'flex-start' as const },
  colorsGrid: {
    flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10, width: '100%',
  },
  colorOption: {
    width: '22%', alignItems: 'center' as const, paddingVertical: 10,
  },
  colorSwatch: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2, marginBottom: 6,
  },
  colorName: { fontSize: 11, fontWeight: '600' as const },
  resetLink: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 20 },
  resetLinkText: { fontSize: 13 },
  playingContainer: { alignItems: 'center' as const, paddingTop: 16, gap: 20 },
  timerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
  timerText: { fontSize: 36, fontWeight: '800' as const },
  colorBanner: {
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 20, borderWidth: 2,
  },
  colorBannerText: { fontSize: 16, fontWeight: '700' as const },
  bigCount: { fontSize: 80, fontWeight: '900' as const, textAlign: 'center' as const },
  countLabel: { fontSize: 14, textAlign: 'center' as const, marginTop: -8 },
  tapButton: {
    borderRadius: 20, paddingVertical: 32, alignItems: 'center' as const,
    borderWidth: 2, gap: 8,
  },
  tapButtonText: { fontSize: 18, fontWeight: '800' as const, letterSpacing: 2 },
  endButton: {
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24,
  },
  endButtonText: { fontSize: 14, fontWeight: '600' as const },
  resultContainer: { alignItems: 'center' as const, paddingTop: 24 },
  resultCard: {
    borderRadius: 20, padding: 32, alignItems: 'center' as const, width: '100%', marginBottom: 24,
  },
  resultColorSwatch: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2, marginBottom: 12,
  },
  resultTitle: { fontSize: 24, fontWeight: 'bold' as const, marginTop: 12, marginBottom: 8 },
  resultCount: { fontSize: 56, fontWeight: '900' as const, marginBottom: 4 },
  resultLabel: { fontSize: 14, marginBottom: 12 },
  newHighBadge: {
    backgroundColor: '#FFD70030', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4,
  },
  newHighText: { color: '#D4A017', fontWeight: '700' as const, fontSize: 13 },
  playAgainButton: {
    borderRadius: 14, paddingVertical: 16, width: '100%', alignItems: 'center' as const, marginBottom: 12, borderWidth: 2,
  },
  playAgainText: { fontSize: 16, fontWeight: '700' as const },
  newColorButton: {
    borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center' as const,
  },
  newColorText: { fontSize: 15, fontWeight: '600' as const },
});
