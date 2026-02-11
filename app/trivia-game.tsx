import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { ChevronLeft, Brain, Trophy, CheckCircle, XCircle, RotateCcw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useTrivia, TriviaQuestion } from '@/store/trivia-store';

type GameState = 'menu' | 'playing' | 'result';

export default function TriviaGameScreen() {
  const { isDark } = useTheme();
  const { highScore, totalAnswered, accuracy, getNewRound, recordResult, resetStats } = useTrivia();

  const [gameState, setGameState] = useState<GameState>('menu');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;

  const startGame = useCallback(() => {
    const round = getNewRound(10);
    setQuestions(round);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowCorrect(false);
    setGameState('playing');
  }, [getNewRound]);

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowCorrect(true);

    const isCorrect = index === questions[currentIndex].correctIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setShowCorrect(false);
        }, 200);
      } else {
        const finalScore = isCorrect ? score + 1 : score;
        recordResult(finalScore, questions.length);
        setGameState('result');
      }
    }, 1200);
  }, [selectedAnswer, currentIndex, questions, score, fadeAnim, scaleAnim, recordResult]);

  const currentQ = questions[currentIndex];

  const getOptionStyle = (index: number) => {
    if (!showCorrect) {
      return { backgroundColor: isDark ? '#2a2a3e' : '#f0f0f5', borderColor: isDark ? '#3a3a4f' : '#e0e0e0' };
    }
    if (index === currentQ?.correctIndex) {
      return { backgroundColor: '#10B98130', borderColor: '#10B981' };
    }
    if (index === selectedAnswer && index !== currentQ?.correctIndex) {
      return { backgroundColor: '#EF444430', borderColor: '#EF4444' };
    }
    return { backgroundColor: isDark ? '#2a2a3e' : '#f0f0f5', borderColor: isDark ? '#3a3a4f' : '#e0e0e0' };
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen
        options={{
          title: 'Road Trip Trivia',
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
        {gameState === 'menu' && (
          <View style={styles.menuContainer}>
            <View style={[styles.iconCircle, { backgroundColor: '#8B5CF620' }]}>
              <Brain size={48} color="#8B5CF6" />
            </View>
            <Text style={[styles.menuTitle, { color: textColor }]}>Road Trip Trivia</Text>
            <Text style={[styles.menuSubtitle, { color: textSecondary }]}>
              Test your knowledge about US geography, roads, landmarks, and more!
            </Text>

            <View style={[styles.statsRow, { backgroundColor: cardColor }]}>
              <View style={styles.menuStatItem}>
                <Text style={[styles.menuStatValue, { color: '#8B5CF6' }]}>{highScore}</Text>
                <Text style={[styles.menuStatLabel, { color: textSecondary }]}>Best</Text>
              </View>
              <View style={styles.menuStatDivider} />
              <View style={styles.menuStatItem}>
                <Text style={[styles.menuStatValue, { color: Colors.success }]}>{accuracy}%</Text>
                <Text style={[styles.menuStatLabel, { color: textSecondary }]}>Accuracy</Text>
              </View>
              <View style={styles.menuStatDivider} />
              <View style={styles.menuStatItem}>
                <Text style={[styles.menuStatValue, { color: Colors.primary }]}>{totalAnswered}</Text>
                <Text style={[styles.menuStatLabel, { color: textSecondary }]}>Answered</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.playButton} onPress={startGame}>
              <Text style={styles.playButtonText}>Start Game</Text>
            </TouchableOpacity>

            {totalAnswered > 0 && (
              <TouchableOpacity
                style={[styles.resetLink]}
                onPress={() => {
                  resetStats();
                }}
              >
                <RotateCcw size={14} color={textSecondary} />
                <Text style={[styles.resetLinkText, { color: textSecondary }]}>Reset Stats</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {gameState === 'playing' && currentQ && (
          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.questionHeader}>
              <Text style={[styles.questionNumber, { color: textSecondary }]}>
                Question {currentIndex + 1} of {questions.length}
              </Text>
              <View style={[styles.scorePill, { backgroundColor: '#8B5CF620' }]}>
                <Text style={[styles.scoreText, { color: '#8B5CF6' }]}>{score} pts</Text>
              </View>
            </View>

            <View style={styles.progressDots}>
              {questions.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i < currentIndex ? Colors.success :
                        i === currentIndex ? '#8B5CF6' :
                        isDark ? '#333' : '#ddd',
                    },
                  ]}
                />
              ))}
            </View>

            <View style={[styles.categoryPill, { backgroundColor: '#F9731620' }]}>
              <Text style={[styles.categoryText, { color: '#F97316' }]}>{currentQ.category}</Text>
            </View>

            <Text style={[styles.questionText, { color: textColor }]}>{currentQ.question}</Text>

            <View style={styles.optionsContainer}>
              {currentQ.options.map((option, index) => {
                const optStyle = getOptionStyle(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.optionButton, optStyle]}
                    onPress={() => handleAnswer(index)}
                    disabled={selectedAnswer !== null}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <View style={[styles.optionLetter, { backgroundColor: isDark ? '#1a1a24' : '#fff' }]}>
                        <Text style={[styles.optionLetterText, { color: textColor }]}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>
                      <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                      {showCorrect && index === currentQ.correctIndex && (
                        <CheckCircle size={20} color="#10B981" />
                      )}
                      {showCorrect && index === selectedAnswer && index !== currentQ.correctIndex && (
                        <XCircle size={20} color="#EF4444" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {gameState === 'result' && (
          <View style={styles.resultContainer}>
            <View style={[styles.resultCard, { backgroundColor: cardColor }]}>
              <Trophy size={56} color="#FFD700" />
              <Text style={[styles.resultTitle, { color: textColor }]}>Round Complete!</Text>
              <Text style={[styles.resultScore, { color: '#8B5CF6' }]}>
                {score} / {questions.length}
              </Text>
              <Text style={[styles.resultLabel, { color: textSecondary }]}>
                {score >= 8 ? 'Outstanding!' : score >= 6 ? 'Great job!' : score >= 4 ? 'Not bad!' : 'Keep practicing!'}
              </Text>

              {score > highScore - (score) && score === highScore && (
                <View style={[styles.newHighBadge]}>
                  <Text style={styles.newHighText}>New High Score!</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.playButton} onPress={startGame}>
              <Text style={styles.playButtonText}>Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: cardColor }]}
              onPress={() => setGameState('menu')}
            >
              <Text style={[styles.backButtonText, { color: textColor }]}>Back to Menu</Text>
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
  menuContainer: { alignItems: 'center' as const, paddingTop: 20 },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  menuTitle: { fontSize: 26, fontWeight: 'bold' as const, marginBottom: 8 },
  menuSubtitle: { fontSize: 14, textAlign: 'center' as const, maxWidth: '85%', lineHeight: 20, marginBottom: 24 },
  statsRow: {
    flexDirection: 'row' as const,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  menuStatItem: { flex: 1, alignItems: 'center' as const },
  menuStatValue: { fontSize: 22, fontWeight: 'bold' as const },
  menuStatLabel: { fontSize: 11, marginTop: 2 },
  menuStatDivider: { width: 1, backgroundColor: '#e0e0e0' },
  playButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  playButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' as const },
  resetLink: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 8 },
  resetLinkText: { fontSize: 13 },
  questionContainer: { paddingTop: 8 },
  questionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  questionNumber: { fontSize: 13, fontWeight: '600' as const },
  scorePill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  scoreText: { fontSize: 13, fontWeight: '700' as const },
  progressDots: {
    flexDirection: 'row' as const,
    gap: 6,
    marginBottom: 20,
    justifyContent: 'center' as const,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  categoryPill: {
    alignSelf: 'flex-start' as const,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  categoryText: { fontSize: 12, fontWeight: '600' as const },
  questionText: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28, marginBottom: 24 },
  optionsContainer: { gap: 10 },
  optionButton: { borderRadius: 12, borderWidth: 1.5, padding: 14 },
  optionContent: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12 },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  optionLetterText: { fontSize: 14, fontWeight: '700' as const },
  optionText: { fontSize: 15, fontWeight: '500' as const, flex: 1 },
  resultContainer: { alignItems: 'center' as const, paddingTop: 30 },
  resultCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center' as const,
    width: '100%',
    marginBottom: 24,
  },
  resultTitle: { fontSize: 24, fontWeight: 'bold' as const, marginTop: 16, marginBottom: 8 },
  resultScore: { fontSize: 48, fontWeight: '800' as const, marginBottom: 4 },
  resultLabel: { fontSize: 16, marginBottom: 12 },
  newHighBadge: {
    backgroundColor: '#FFD70030',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 8,
  },
  newHighText: { color: '#D4A017', fontWeight: '700' as const, fontSize: 13 },
  backButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center' as const,
  },
  backButtonText: { fontSize: 15, fontWeight: '600' as const },
});
