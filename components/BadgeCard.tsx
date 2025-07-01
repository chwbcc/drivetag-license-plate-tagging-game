import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';
import { Badge } from '@/types';

interface BadgeCardProps {
  badge: Badge;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function BadgeCard({ badge, onPress, size = 'medium' }: BadgeCardProps) {
  const rarityColors = {
    common: '#A0A0A0',
    uncommon: '#4CAF50',
    rare: '#2196F3',
    epic: '#9C27B0',
    legendary: '#FF9800',
  };
  
  const sizeStyles = {
    small: {
      container: { width: 80, height: 100 },
      icon: { fontSize: 24 },
      name: { fontSize: 10 },
    },
    medium: {
      container: { width: 100, height: 120 },
      icon: { fontSize: 32 },
      name: { fontSize: 12 },
    },
    large: {
      container: { width: 120, height: 140 },
      icon: { fontSize: 40 },
      name: { fontSize: 14 },
    },
  };
  
  const containerStyle = [
    styles.container,
    { borderColor: rarityColors[badge.rarity] },
    sizeStyles[size].container,
  ];
  
  const content = (
    <>
      <View style={[styles.iconContainer, { backgroundColor: rarityColors[badge.rarity] + '20' }]}>
        <Text style={[styles.icon, sizeStyles[size].icon]}>{badge.icon}</Text>
      </View>
      <Text style={[styles.name, sizeStyles[size].name]} numberOfLines={2}>{badge.name}</Text>
      <View style={[styles.rarityIndicator, { backgroundColor: rarityColors[badge.rarity] }]}>
        <Text style={styles.rarityText}>{badge.rarity}</Text>
      </View>
    </>
  );
  
  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={containerStyle}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 8,
    margin: 6,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: '70%',
    aspectRatio: 1,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    textAlign: 'center',
  },
  name: {
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  rarityIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 2,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  rarityText: {
    color: '#fff',
    fontSize: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
});