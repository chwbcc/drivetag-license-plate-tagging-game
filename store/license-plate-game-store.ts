import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import useAuthStore from './auth-store';

interface PlateSpotting {
  state: string;
  spottedAt: number;
  count: number;
  userId: string;
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

const STORAGE_KEY = '@license_plate_spottings_v2';

export const [LicensePlateGameProvider, useLicensePlateGame] = createContextHook(() => {
  const { user } = useAuthStore();
  const [spottedPlates, setSpottedPlates] = useState<Record<string, PlateSpotting>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const userKey = `${STORAGE_KEY}_${user.id}`;
        const stored = await AsyncStorage.getItem(userKey);
        if (stored) {
          setSpottedPlates(JSON.parse(stored));
        } else {
          setSpottedPlates({});
        }
      } catch (error) {
        console.error('Failed to load license plate spottings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    load();
  }, [user?.id]);

  const saveSpottings = useCallback(async (spottings: Record<string, PlateSpotting>) => {
    if (!user) return;
    
    try {
      const userKey = `${STORAGE_KEY}_${user.id}`;
      await AsyncStorage.setItem(userKey, JSON.stringify(spottings));
    } catch (error) {
      console.error('Failed to save license plate spottings:', error);
    }
  }, [user]);

  const spotPlate = useCallback((stateCode: string) => {
    if (!user) {
      console.warn('Cannot spot plate without logged in user');
      return;
    }
    
    const now = Date.now();
    setSpottedPlates((prev) => {
      const existing = prev[stateCode];
      const updated = {
        ...prev,
        [stateCode]: {
          state: stateCode,
          spottedAt: now,
          count: existing ? existing.count + 1 : 1,
          userId: user.id,
        },
      };
      saveSpottings(updated);
      return updated;
    });
  }, [user, saveSpottings]);

  const unspotPlate = useCallback((stateCode: string) => {
    setSpottedPlates((prev) => {
      const updated = { ...prev };
      delete updated[stateCode];
      saveSpottings(updated);
      return updated;
    });
  }, [saveSpottings]);

  const resetGame = useCallback(async () => {
    if (!user) return;
    
    setSpottedPlates({});
    try {
      const userKey = `${STORAGE_KEY}_${user.id}`;
      await AsyncStorage.removeItem(userKey);
    } catch (error) {
      console.error('Failed to reset game:', error);
    }
  }, [user]);

  const isPlateSpotted = useCallback((stateCode: string) => {
    return stateCode in spottedPlates;
  }, [spottedPlates]);

  const getSpottedCount = useCallback(() => {
    return Object.keys(spottedPlates).length;
  }, [spottedPlates]);

  const getProgress = useCallback(() => {
    const count = Object.keys(spottedPlates).length;
    return (count / US_STATES.length) * 100;
  }, [spottedPlates]);

  return {
    spottedPlates,
    states: US_STATES,
    spotPlate,
    unspotPlate,
    resetGame,
    isPlateSpotted,
    getSpottedCount,
    getProgress,
    isLoading,
    totalStates: US_STATES.length,
  };
});
