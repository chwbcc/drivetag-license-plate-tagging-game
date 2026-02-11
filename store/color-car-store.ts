import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

const STORAGE_KEY = '@color_car_count';

const COLORS: ColorOption[] = [
  { id: 'red', name: 'Red', hex: '#EF4444' },
  { id: 'blue', name: 'Blue', hex: '#3B82F6' },
  { id: 'white', name: 'White', hex: '#F3F4F6' },
  { id: 'black', name: 'Black', hex: '#1F2937' },
  { id: 'silver', name: 'Silver', hex: '#9CA3AF' },
  { id: 'green', name: 'Green', hex: '#10B981' },
  { id: 'yellow', name: 'Yellow', hex: '#F59E0B' },
  { id: 'orange', name: 'Orange', hex: '#F97316' },
  { id: 'purple', name: 'Purple', hex: '#8B5CF6' },
  { id: 'brown', name: 'Brown', hex: '#92400E' },
  { id: 'pink', name: 'Pink', hex: '#EC4899' },
  { id: 'teal', name: 'Teal', hex: '#14B8A6' },
];

export const [ColorCarProvider, useColorCar] = createContextHook(() => {
  const [highScore, setHighScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setHighScore(parsed.highScore ?? 0);
          setGamesPlayed(parsed.gamesPlayed ?? 0);
        } catch (e) {
          console.log('[ColorCar] Failed to parse stored data');
        }
      }
    });
  }, []);

  const save = useCallback((hs: number, gp: number) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ highScore: hs, gamesPlayed: gp })).catch(console.error);
  }, []);

  const recordGame = useCallback((count: number) => {
    setGamesPlayed((prev) => {
      const newGP = prev + 1;
      setHighScore((prevHS) => {
        const newHS = Math.max(prevHS, count);
        save(newHS, newGP);
        return newHS;
      });
      return newGP;
    });
  }, [save]);

  const resetStats = useCallback(() => {
    setHighScore(0);
    setGamesPlayed(0);
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
  }, []);

  return useMemo(() => ({
    colors: COLORS,
    highScore,
    gamesPlayed,
    recordGame,
    resetStats,
  }), [highScore, gamesPlayed, recordGame, resetStats]);
});
