import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Plus, Target, ThumbsUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import PelletCard from '@/components/PelletCard';
import Button from '@/components/Button';
import usePelletStore from '@/store/pellet-store';
import useAuthStore from '@/store/auth-store';

export default function HomeScreen() {
  const { pellets } = usePelletStore();
  const { user } = useAuthStore();
  const [pelletType, setPelletType] = useState<'negative' | 'positive'>('negative');
  
  const recentPellets = [...pellets]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 10);
  
  const handleTagDriver = () => {
    if (!user) {
      Alert.alert('Error', 'You need to be logged in to tag a driver');
      return;
    }
    
    const pelletCount = pelletType === 'positive' 
      ? (user.positivePelletCount || 0) 
      : user.pelletCount;
    
    if (pelletCount <= 0) {
      Alert.alert(
        'No Pellets',
        `You need ${pelletType} pellets to tag a driver. Visit the shop to purchase more.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go to Shop', 
            onPress: () => router.push('/(tabs)/shop')
          }
        ]
      );
      return;
    }
    
    router.push({
      pathname: '/tag-driver',
      params: { type: pelletType }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Driver</Text>
          <Text style={styles.licensePlate}>{user?.licensePlate || 'No License Plate'}</Text>
        </View>
        
        <View style={styles.pelletCountContainer}>
          <View style={styles.pelletCount}>
            <Text style={styles.pelletCountLabel}>Negative:</Text>
            <Text style={styles.pelletCountValue}>{user?.pelletCount || 0}</Text>
          </View>
          <View style={styles.pelletCount}>
            <Text style={styles.pelletCountLabel}>Positive:</Text>
            <Text style={[styles.pelletCountValue, styles.positivePelletCount]}>
              {user?.positivePelletCount || 0}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.tagButtonContainer}>
        <View style={styles.tagTypeSelector}>
          <TouchableOpacity 
            style={[
              styles.tagTypeButton, 
              pelletType === 'negative' && styles.tagTypeButtonActive
            ]}
            onPress={() => setPelletType('negative')}
          >
            <Target 
              size={16} 
              color={pelletType === 'negative' ? Colors.primary : Colors.textSecondary} 
              style={styles.tagTypeIcon}
            />
            <Text style={[
              styles.tagTypeText,
              pelletType === 'negative' && styles.tagTypeTextActive
            ]}>Negative Tag</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tagTypeButton, 
              pelletType === 'positive' && styles.tagTypeButtonActive,
              pelletType === 'positive' && styles.positiveTagTypeButtonActive
            ]}
            onPress={() => setPelletType('positive')}
          >
            <ThumbsUp 
              size={16} 
              color={pelletType === 'positive' ? Colors.success : Colors.textSecondary} 
              style={styles.tagTypeIcon}
            />
            <Text style={[
              styles.tagTypeText,
              pelletType === 'positive' && styles.positiveTagTypeTextActive
            ]}>Positive Tag</Text>
          </TouchableOpacity>
        </View>
        
        <Button
          title={`Tag a Driver (${pelletType === 'positive' ? 'Positive' : 'Negative'})`}
          onPress={handleTagDriver}
          style={[
            styles.tagButton,
            pelletType === 'positive' && styles.positiveTagButton
          ]}
          textStyle={styles.tagButtonText}
        />
      </View>
      
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Tags</Text>
        
        {recentPellets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>💥</Text>
            <Text style={styles.emptyStateText}>No pellets yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start tagging drivers to see them here
            </Text>
          </View>
        ) : (
          <FlatList
            data={recentPellets}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PelletCard pellet={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.floatingButton,
          pelletType === 'positive' && styles.positiveFloatingButton
        ]}
        onPress={handleTagDriver}
      >
        {pelletType === 'positive' ? (
          <ThumbsUp size={24} color="#fff" />
        ) : (
          <Plus size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  licensePlate: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  pelletCountContainer: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pelletCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pelletCountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  pelletCountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  positivePelletCount: {
    color: Colors.success,
  },
  tagButtonContainer: {
    marginBottom: 24,
  },
  tagTypeSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 4,
  },
  tagTypeButtonActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  positiveTagTypeButtonActive: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success,
  },
  tagTypeIcon: {
    marginRight: 6,
  },
  tagTypeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tagTypeTextActive: {
    color: Colors.primary,
    fontWeight: '500',
  },
  positiveTagTypeTextActive: {
    color: Colors.success,
    fontWeight: '500',
  },
  tagButton: {
    backgroundColor: Colors.primary,
  },
  positiveTagButton: {
    backgroundColor: Colors.success,
  },
  tagButtonText: {
    color: '#fff',
  },
  recentContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateEmoji: {
    fontSize: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  positiveFloatingButton: {
    backgroundColor: Colors.success,
  },
});