import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

interface SpottedAnimal {
  id: string;
  name: string;
  category: string;
  spottedAt: number;
  count: number;
}

interface Animal {
  id: string;
  name: string;
  emoji: string;
  category: string;
  points: number;
}

const STORAGE_KEY = '@animal_spotter';

const ANIMALS: Animal[] = [
  { id: 'cow', name: 'Cow', emoji: '🐄', category: 'Farm', points: 1 },
  { id: 'horse', name: 'Horse', emoji: '🐴', category: 'Farm', points: 1 },
  { id: 'sheep', name: 'Sheep', emoji: '🐑', category: 'Farm', points: 1 },
  { id: 'goat', name: 'Goat', emoji: '🐐', category: 'Farm', points: 2 },
  { id: 'pig', name: 'Pig', emoji: '🐷', category: 'Farm', points: 2 },
  { id: 'chicken', name: 'Chicken', emoji: '🐔', category: 'Farm', points: 2 },
  { id: 'llama', name: 'Llama/Alpaca', emoji: '🦙', category: 'Farm', points: 5 },
  { id: 'donkey', name: 'Donkey', emoji: '🫏', category: 'Farm', points: 3 },
  { id: 'hawk', name: 'Hawk/Eagle', emoji: '🦅', category: 'Birds', points: 3 },
  { id: 'crow', name: 'Crow/Raven', emoji: '🐦‍⬛', category: 'Birds', points: 1 },
  { id: 'heron', name: 'Heron/Crane', emoji: '🦩', category: 'Birds', points: 4 },
  { id: 'owl', name: 'Owl', emoji: '🦉', category: 'Birds', points: 8 },
  { id: 'turkey_vulture', name: 'Vulture', emoji: '🦅', category: 'Birds', points: 2 },
  { id: 'geese', name: 'Geese', emoji: '🪿', category: 'Birds', points: 2 },
  { id: 'deer', name: 'Deer', emoji: '🦌', category: 'Wild', points: 3 },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐇', category: 'Wild', points: 2 },
  { id: 'squirrel', name: 'Squirrel', emoji: '🐿️', category: 'Wild', points: 1 },
  { id: 'fox', name: 'Fox', emoji: '🦊', category: 'Wild', points: 6 },
  { id: 'coyote', name: 'Coyote', emoji: '🐺', category: 'Wild', points: 7 },
  { id: 'bear', name: 'Bear', emoji: '🐻', category: 'Wild', points: 10 },
  { id: 'moose', name: 'Moose', emoji: '🫎', category: 'Wild', points: 10 },
  { id: 'turtle', name: 'Turtle', emoji: '🐢', category: 'Wild', points: 4 },
  { id: 'raccoon', name: 'Raccoon', emoji: '🦝', category: 'Wild', points: 3 },
  { id: 'skunk', name: 'Skunk', emoji: '🦨', category: 'Wild', points: 4 },
  { id: 'armadillo', name: 'Armadillo', emoji: '🐾', category: 'Wild', points: 6 },
  { id: 'dog', name: 'Dog (in car)', emoji: '🐕', category: 'Pets', points: 1 },
  { id: 'cat', name: 'Cat', emoji: '🐈', category: 'Pets', points: 2 },
  { id: 'alligator', name: 'Alligator', emoji: '🐊', category: 'Wild', points: 10 },
];

export const [AnimalSpotterProvider, useAnimalSpotter] = createContextHook(() => {
  const [spottedAnimals, setSpottedAnimals] = useState<Record<string, SpottedAnimal>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setSpottedAnimals(JSON.parse(data));
        } catch (e) {
          console.log('[AnimalSpotter] Failed to parse stored data');
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback((animals: Record<string, SpottedAnimal>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(animals)).catch(console.error);
  }, []);

  const spotAnimal = useCallback((animalId: string) => {
    setSpottedAnimals((prev) => {
      const animal = ANIMALS.find((a) => a.id === animalId);
      if (!animal) return prev;
      const existing = prev[animalId];
      const updated = {
        ...prev,
        [animalId]: {
          id: animalId,
          name: animal.name,
          category: animal.category,
          spottedAt: existing?.spottedAt ?? Date.now(),
          count: (existing?.count ?? 0) + 1,
        },
      };
      save(updated);
      return updated;
    });
  }, [save]);

  const unspotAnimal = useCallback((animalId: string) => {
    setSpottedAnimals((prev) => {
      const updated = { ...prev };
      delete updated[animalId];
      save(updated);
      return updated;
    });
  }, [save]);

  const resetGame = useCallback(() => {
    setSpottedAnimals({});
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
  }, []);

  const getSpottedCount = useCallback(() => Object.keys(spottedAnimals).length, [spottedAnimals]);
  const totalAnimals = ANIMALS.length;
  const getProgress = useCallback(() => (getSpottedCount() / totalAnimals) * 100, [getSpottedCount, totalAnimals]);

  const getTotalPoints = useCallback(() => {
    return Object.keys(spottedAnimals).reduce((sum, id) => {
      const animal = ANIMALS.find((a) => a.id === id);
      const spotted = spottedAnimals[id];
      return sum + (animal?.points ?? 0) * (spotted?.count ?? 1);
    }, 0);
  }, [spottedAnimals]);

  return useMemo(() => ({
    animals: ANIMALS,
    spottedAnimals,
    spotAnimal,
    unspotAnimal,
    resetGame,
    getSpottedCount,
    getProgress,
    getTotalPoints,
    totalAnimals,
    isLoaded,
  }), [spottedAnimals, spotAnimal, unspotAnimal, resetGame, getSpottedCount, getProgress, getTotalPoints, totalAnimals, isLoaded]);
});
