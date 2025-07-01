import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Clock, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Pellet } from '@/types';

interface PelletCardProps {
  pellet: Pellet;
}

export default function PelletCard({ pellet }: PelletCardProps) {
  const formattedDate = new Date(pellet.createdAt).toLocaleDateString();
  const isPositive = pellet.type === 'positive';
  
  return (
    <View style={[
      styles.container, 
      isPositive ? styles.positiveContainer : styles.negativeContainer
    ]}>
      <View style={styles.header}>
        <View style={[
          styles.pelletIcon,
          isPositive ? styles.positivePelletIcon : styles.negativePelletIcon
        ]}>
          {isPositive ? (
            <ThumbsUp size={18} color="#fff" />
          ) : (
            <ThumbsDown size={18} color="#fff" />
          )}
        </View>
        <Text style={styles.licensePlate}>{pellet.targetLicensePlate}</Text>
      </View>
      
      <Text style={styles.reason}>{pellet.reason}</Text>
      
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Clock size={14} color={Colors.textSecondary} />
          <Text style={styles.footerText}>{formattedDate}</Text>
        </View>
        
        {pellet.location && (
          <View style={styles.footerItem}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.footerText}>Location recorded</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  negativeContainer: {
    borderColor: Colors.border,
  },
  positiveContainer: {
    borderColor: Colors.success + '50', // 50% opacity
    backgroundColor: Colors.success + '05', // 5% opacity
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pelletIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  negativePelletIcon: {
    backgroundColor: Colors.secondary,
  },
  positivePelletIcon: {
    backgroundColor: Colors.success,
  },
  licensePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  reason: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});