import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Award, Lock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import BadgeCard from '@/components/BadgeCard';
import useAuthStore from '@/store/auth-store';
import useBadgeStore from '@/store/badge-store';

export default function BadgesScreen() {
  const { user } = useAuthStore();
  const { badges, getUserBadges, checkAndAwardBadges } = useBadgeStore();
  const [newBadges, setNewBadges] = useState<string[]>([]);
  
  useEffect(() => {
    if (user) {
      // Check for new badges when the screen loads
      const awarded = checkAndAwardBadges(user.id);
      if (awarded.length > 0) {
        setNewBadges(awarded);
        
        // Show alert for new badges
        Alert.alert(
          'New Badges Earned!',
          `Congratulations! You've earned ${awarded.length} new badge${awarded.length > 1 ? 's' : ''}.`,
          [{ text: 'View', onPress: () => setNewBadges([]) }]
        );
      }
    }
  }, [user]);
  
  const userBadges = user ? getUserBadges(user.id) : [];
  const unlockedBadgeIds = userBadges.map(badge => badge.id);
  
  const handleBadgePress = (badge: any) => {
    Alert.alert(
      badge.name,
      badge.description,
      [{ text: 'OK' }]
    );
  };
  
  const renderBadge = ({ item }: { item: any }) => {
    const isUnlocked = unlockedBadgeIds.includes(item.id);
    const isNew = newBadges.includes(item.id);
    
    if (isUnlocked) {
      return (
        <View style={isNew ? styles.newBadgeContainer : undefined}>
          {isNew && <View style={styles.newBadgeIndicator} />}
          <BadgeCard 
            badge={item} 
            onPress={() => handleBadgePress(item)}
          />
        </View>
      );
    }
    
    return (
      <View style={styles.lockedBadgeContainer}>
        <BadgeCard 
          badge={{
            ...item,
            icon: '🔒',
          }} 
          onPress={() => handleBadgePress(item)}
        />
        <View style={styles.lockedOverlay}>
          <Lock size={24} color="#fff" />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Badges</Text>
        <View style={styles.badgeCountContainer}>
          <Text style={styles.badgeCountLabel}>Unlocked:</Text>
          <Text style={styles.badgeCount}>{userBadges.length} / {badges.length}</Text>
        </View>
      </View>
      
      {userBadges.length === 0 ? (
        <View style={styles.emptyState}>
          <Award size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyStateText}>No badges yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Tag drivers and drive responsibly to earn badges
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Unlocked Badges</Text>
          <FlatList
            data={userBadges}
            keyExtractor={(item) => item.id}
            renderItem={renderBadge}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgeList}
          />
        </>
      )}
      
      <Text style={styles.sectionTitle}>Available Badges</Text>
      <FlatList
        data={badges}
        keyExtractor={(item) => item.id}
        renderItem={renderBadge}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.allBadgesList}
      />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  badgeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeCountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  badgeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
    marginTop: 16,
  },
  badgeList: {
    paddingBottom: 16,
  },
  allBadgesList: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
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
  lockedBadgeContainer: {
    position: 'relative',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadgeContainer: {
    position: 'relative',
  },
  newBadgeIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
    zIndex: 1,
  },
});