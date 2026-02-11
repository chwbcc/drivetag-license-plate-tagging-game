import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

const STORAGE_KEY = '@trivia_game';

const QUESTIONS: TriviaQuestion[] = [
  { id: 't1', question: 'Which US state has the most miles of interstate highway?', options: ['California', 'Texas', 'Florida', 'New York'], correctIndex: 1, category: 'Geography' },
  { id: 't2', question: 'What is the longest highway in the US?', options: ['I-90', 'I-10', 'US Route 20', 'US Route 6'], correctIndex: 0, category: 'Roads' },
  { id: 't3', question: 'Which state is known as the "Sunshine State"?', options: ['California', 'Arizona', 'Florida', 'Hawaii'], correctIndex: 2, category: 'States' },
  { id: 't4', question: 'How many Great Lakes are there?', options: ['3', '4', '5', '6'], correctIndex: 2, category: 'Geography' },
  { id: 't5', question: 'Which US city is known as the "Windy City"?', options: ['San Francisco', 'Chicago', 'Boston', 'Denver'], correctIndex: 1, category: 'Cities' },
  { id: 't6', question: 'What is the smallest US state by area?', options: ['Delaware', 'Connecticut', 'Rhode Island', 'Vermont'], correctIndex: 2, category: 'States' },
  { id: 't7', question: 'Route 66 starts in Chicago and ends in which city?', options: ['San Diego', 'Los Angeles', 'San Francisco', 'Santa Monica'], correctIndex: 3, category: 'Roads' },
  { id: 't8', question: 'Which mountain is the tallest in the US?', options: ['Mt. Rainier', 'Denali', 'Mt. Whitney', 'Mt. Elbert'], correctIndex: 1, category: 'Geography' },
  { id: 't9', question: 'Which state has the most national parks?', options: ['Utah', 'Alaska', 'California', 'Colorado'], correctIndex: 2, category: 'States' },
  { id: 't10', question: 'The Golden Gate Bridge is in which city?', options: ['Los Angeles', 'San Diego', 'San Francisco', 'Sacramento'], correctIndex: 2, category: 'Landmarks' },
  { id: 't11', question: 'Which river is the longest in the US?', options: ['Mississippi', 'Missouri', 'Colorado', 'Ohio'], correctIndex: 1, category: 'Geography' },
  { id: 't12', question: 'What US state produces the most oranges?', options: ['California', 'Texas', 'Florida', 'Arizona'], correctIndex: 2, category: 'States' },
  { id: 't13', question: 'Which US state was the last to join the union?', options: ['Alaska', 'Hawaii', 'Arizona', 'New Mexico'], correctIndex: 1, category: 'States' },
  { id: 't14', question: 'Mt. Rushmore is located in which state?', options: ['Wyoming', 'Montana', 'South Dakota', 'North Dakota'], correctIndex: 2, category: 'Landmarks' },
  { id: 't15', question: 'What is the speed limit on most US interstates?', options: ['55 mph', '65 mph', '70 mph', 'It varies by state'], correctIndex: 3, category: 'Roads' },
  { id: 't16', question: 'The Statue of Liberty was a gift from which country?', options: ['England', 'Spain', 'France', 'Italy'], correctIndex: 2, category: 'Landmarks' },
  { id: 't17', question: 'Which state is the Grand Canyon located in?', options: ['Utah', 'Arizona', 'Nevada', 'Colorado'], correctIndex: 1, category: 'Landmarks' },
  { id: 't18', question: 'What year was the interstate highway system started?', options: ['1946', '1956', '1966', '1976'], correctIndex: 1, category: 'Roads' },
  { id: 't19', question: 'Which US city has the most bridges?', options: ['New York', 'Pittsburgh', 'Portland', 'San Francisco'], correctIndex: 1, category: 'Cities' },
  { id: 't20', question: 'What is the capital of Montana?', options: ['Billings', 'Missoula', 'Helena', 'Bozeman'], correctIndex: 2, category: 'States' },
  { id: 't21', question: 'Yellowstone National Park is mainly in which state?', options: ['Montana', 'Idaho', 'Wyoming', 'Colorado'], correctIndex: 2, category: 'Landmarks' },
  { id: 't22', question: 'Which city hosted the first traffic light in the US?', options: ['New York', 'Cleveland', 'Detroit', 'Chicago'], correctIndex: 1, category: 'Roads' },
  { id: 't23', question: 'What desert covers parts of California and Nevada?', options: ['Sonoran', 'Chihuahuan', 'Mojave', 'Great Basin'], correctIndex: 2, category: 'Geography' },
  { id: 't24', question: 'Which state has the most coastline?', options: ['Florida', 'California', 'Hawaii', 'Alaska'], correctIndex: 3, category: 'Geography' },
  { id: 't25', question: 'The Alamo is a famous landmark in which city?', options: ['Houston', 'Austin', 'San Antonio', 'Dallas'], correctIndex: 2, category: 'Landmarks' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const [TriviaProvider, useTrivia] = createContextHook(() => {
  const [highScore, setHighScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setHighScore(parsed.highScore ?? 0);
          setTotalAnswered(parsed.totalAnswered ?? 0);
          setTotalCorrect(parsed.totalCorrect ?? 0);
        } catch (e) {
          console.log('[Trivia] Failed to parse stored data');
        }
      }
    });
  }, []);

  const save = useCallback((hs: number, ta: number, tc: number) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ highScore: hs, totalAnswered: ta, totalCorrect: tc })).catch(console.error);
  }, []);

  const getNewRound = useCallback((count: number = 10) => {
    return shuffleArray(QUESTIONS).slice(0, count);
  }, []);

  const recordResult = useCallback((correct: number, total: number) => {
    setTotalAnswered((prev) => {
      const newVal = prev + total;
      setTotalCorrect((prevC) => {
        const newCorrect = prevC + correct;
        setHighScore((prevH) => {
          const newHigh = Math.max(prevH, correct);
          save(newHigh, newVal, newCorrect);
          return newHigh;
        });
        return newCorrect;
      });
      return newVal;
    });
  }, [save]);

  const resetStats = useCallback(() => {
    setHighScore(0);
    setTotalAnswered(0);
    setTotalCorrect(0);
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
  }, []);

  return useMemo(() => ({
    highScore,
    totalAnswered,
    totalCorrect,
    getNewRound,
    recordResult,
    resetStats,
    accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
  }), [highScore, totalAnswered, totalCorrect, getNewRound, recordResult, resetStats]);
});
