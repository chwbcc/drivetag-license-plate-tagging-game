import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface ExperienceBarProps {
  level: number;
  progress: number;
  currentExp: number;
  nextLevelExp: number;
}

export default function ExperienceBar({ level, progress, currentExp, nextLevelExp }: ExperienceBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <Text style={styles.levelLabel}>Level</Text>
        <Text style={styles.levelValue}>{level}</Text>
      </View>
      
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.expText}>
          {currentExp} / {nextLevelExp} EXP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  levelLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  barContainer: {
    flex: 1,
  },
  barBackground: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  expText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});