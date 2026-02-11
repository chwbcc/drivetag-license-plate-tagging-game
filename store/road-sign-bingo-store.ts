import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

interface SpottedSign {
  id: string;
  name: string;
  category: string;
  spottedAt: number;
  count: number;
}

interface RoadSign {
  id: string;
  name: string;
  emoji: string;
  category: string;
}

const STORAGE_KEY = '@road_sign_bingo';

const ROAD_SIGNS: RoadSign[] = [
  { id: 'stop', name: 'Stop Sign', emoji: '🛑', category: 'Regulatory' },
  { id: 'yield', name: 'Yield', emoji: '⚠️', category: 'Regulatory' },
  { id: 'speed_limit', name: 'Speed Limit', emoji: '🚗', category: 'Regulatory' },
  { id: 'no_parking', name: 'No Parking', emoji: '🅿️', category: 'Regulatory' },
  { id: 'one_way', name: 'One Way', emoji: '➡️', category: 'Regulatory' },
  { id: 'do_not_enter', name: 'Do Not Enter', emoji: '⛔', category: 'Regulatory' },
  { id: 'no_uturn', name: 'No U-Turn', emoji: '🔄', category: 'Regulatory' },
  { id: 'school_zone', name: 'School Zone', emoji: '🏫', category: 'Warning' },
  { id: 'deer_crossing', name: 'Deer Crossing', emoji: '🦌', category: 'Warning' },
  { id: 'curve_ahead', name: 'Curve Ahead', emoji: '↪️', category: 'Warning' },
  { id: 'construction', name: 'Construction', emoji: '🚧', category: 'Warning' },
  { id: 'railroad', name: 'Railroad Crossing', emoji: '🚂', category: 'Warning' },
  { id: 'merge', name: 'Merge', emoji: '🔀', category: 'Warning' },
  { id: 'slippery', name: 'Slippery Road', emoji: '💧', category: 'Warning' },
  { id: 'pedestrian', name: 'Pedestrian Crossing', emoji: '🚶', category: 'Warning' },
  { id: 'interstate', name: 'Interstate Sign', emoji: '🛣️', category: 'Guide' },
  { id: 'exit', name: 'Exit Sign', emoji: '🔢', category: 'Guide' },
  { id: 'rest_area', name: 'Rest Area', emoji: '🏕️', category: 'Guide' },
  { id: 'gas_station', name: 'Gas Station', emoji: '⛽', category: 'Guide' },
  { id: 'food', name: 'Food / Dining', emoji: '🍔', category: 'Guide' },
  { id: 'hospital', name: 'Hospital', emoji: '🏥', category: 'Guide' },
  { id: 'hotel', name: 'Lodging', emoji: '🏨', category: 'Guide' },
  { id: 'mile_marker', name: 'Mile Marker', emoji: '📍', category: 'Guide' },
  { id: 'toll', name: 'Toll Road', emoji: '💰', category: 'Guide' },
  { id: 'detour', name: 'Detour', emoji: '🔃', category: 'Warning' },
];

export const [RoadSignBingoProvider, useRoadSignBingo] = createContextHook(() => {
  const [spottedSigns, setSpottedSigns] = useState<Record<string, SpottedSign>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setSpottedSigns(JSON.parse(data));
        } catch (e) {
          console.log('[RoadSignBingo] Failed to parse stored data');
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback((signs: Record<string, SpottedSign>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(signs)).catch(console.error);
  }, []);

  const spotSign = useCallback((signId: string) => {
    setSpottedSigns((prev) => {
      const sign = ROAD_SIGNS.find((s) => s.id === signId);
      if (!sign) return prev;
      const existing = prev[signId];
      const updated = {
        ...prev,
        [signId]: {
          id: signId,
          name: sign.name,
          category: sign.category,
          spottedAt: existing?.spottedAt ?? Date.now(),
          count: (existing?.count ?? 0) + 1,
        },
      };
      save(updated);
      return updated;
    });
  }, [save]);

  const unspotSign = useCallback((signId: string) => {
    setSpottedSigns((prev) => {
      const updated = { ...prev };
      delete updated[signId];
      save(updated);
      return updated;
    });
  }, [save]);

  const resetGame = useCallback(() => {
    setSpottedSigns({});
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
  }, []);

  const getSpottedCount = useCallback(() => Object.keys(spottedSigns).length, [spottedSigns]);
  const totalSigns = ROAD_SIGNS.length;
  const getProgress = useCallback(() => (getSpottedCount() / totalSigns) * 100, [getSpottedCount, totalSigns]);

  return useMemo(() => ({
    signs: ROAD_SIGNS,
    spottedSigns,
    spotSign,
    unspotSign,
    resetGame,
    getSpottedCount,
    getProgress,
    totalSigns,
    isLoaded,
  }), [spottedSigns, spotSign, unspotSign, resetGame, getSpottedCount, getProgress, totalSigns, isLoaded]);
});
