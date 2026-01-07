import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch, ScrollView, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Plus, Target, ThumbsUp, Moon, Sun, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import BadgeCard from '@/components/BadgeCard';
import CircularGauge from '@/components/CircularGauge';
import useAuthStore from '@/store/auth-store';
import useBadgeStore from '@/store/badge-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { isDark, toggleTheme } = useTheme();
  const { badges, getUserBadges, checkAndAwardBadges } = useBadgeStore();
  const [pelletType, setPelletType] = useState<'negative' | 'positive'>('negative');
  const [newBadges, setNewBadges] = useState<string[]>([]);
  
  useEffect(() => {
    if (user) {
      const awarded = checkAndAwardBadges(user.id);
      if (awarded.length > 0) {
        setNewBadges(awarded);
        Alert.alert(
          'New Badges Earned!',
          `Congratulations! You've earned ${awarded.length} new badge${awarded.length > 1 ? 's' : ''}.`,
          [{ text: 'View', onPress: () => setNewBadges([]) }]
        );
      }
    }
  }, [user, checkAndAwardBadges]);
  
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
            onPress: () => router.push('/(tabs)/shop' as any)
          }
        ]
      );
      return;
    }
    
    router.push({
      pathname: '/tag-driver' as any,
      params: { type: pelletType }
    });
  };

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;
  
  const userBadges = user ? getUserBadges(user.id) : [];
  
  const handleBadgePress = (badge: any) => {
    Alert.alert(
      badge.name,
      badge.description,
      [{ text: 'OK' }]
    );
  };
  
  const renderBadge = ({ item }: { item: any }) => {
    const isNew = newBadges.includes(item.id);
    
    return (
      <View style={isNew ? styles.newBadgeContainer : undefined}>
        {isNew && <View style={styles.newBadgeIndicator} />}
        <BadgeCard 
          badge={item} 
          onPress={() => handleBadgePress(item)}
        />
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.settingsSection, { backgroundColor: cardColor, borderColor }]}>
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconContainer, { backgroundColor: isDark ? '#3a3a4f' : Colors.primary + '20' }]}>
              {isDark ? (
                <Moon size={20} color={Colors.primary} />
              ) : (
                <Sun size={20} color={Colors.primary} />
              )}
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: textColor }]}>Dark Mode</Text>
              <Text style={[styles.settingSubtitle, { color: textSecondary }]}>
                {isDark ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: Colors.primary + '60' }}
            thumbColor={isDark ? Colors.primary : '#f4f3f4'}
            ios_backgroundColor="#767577"
          />
        </View>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: textColor }]}>Driver Score</Text>
          <Text style={[styles.licensePlate, { color: textSecondary }]}>{user?.licensePlate || 'No License Plate'}</Text>
        </View>
        
        <View style={[styles.pelletCountContainer, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.pelletCount}>
            <Text style={[styles.pelletCountLabel, { color: textSecondary }]}>Negative:</Text>
            <Text style={styles.pelletCountValue}>{user?.pelletCount || 0}</Text>
          </View>
          <View style={styles.pelletCount}>
            <Text style={[styles.pelletCountLabel, { color: textSecondary }]}>Positive:</Text>
            <Text style={[styles.pelletCountValue, styles.positivePelletCount]}>
              {user?.positivePelletCount || 0}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.driverScoreSection, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Ratings Received</Text>
        <View style={styles.gaugesContainer}>
          <CircularGauge
            value={user?.positiveRatingCount || 0}
            maxValue={Math.max(100, (user?.positiveRatingCount || 0) + 20)}
            size={120}
            strokeWidth={12}
            color={Colors.success}
            label="Positive"
          />
          <CircularGauge
            value={user?.negativeRatingCount || 0}
            maxValue={Math.max(100, (user?.negativeRatingCount || 0) + 20)}
            size={120}
            strokeWidth={12}
            color={Colors.primary}
            label="Negative"
          />
        </View>
      </View>
      
      <View style={[styles.activitySection, { backgroundColor: cardColor, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Activity</Text>
        <View style={styles.activityItem}>
          <Text style={[styles.activityLabel, { color: textSecondary }]}>Positive Given:</Text>
          <Text style={[styles.activityValue, { color: Colors.success }]}>{user?.positivePelletsGivenCount || 0}</Text>
        </View>
        <View style={styles.activityItem}>
          <Text style={[styles.activityLabel, { color: textSecondary }]}>Negative Given:</Text>
          <Text style={[styles.activityValue, { color: Colors.primary }]}>{user?.negativePelletsGivenCount || 0}</Text>
        </View>
      </View>
      
      <View style={styles.tagButtonContainer}>
        <View style={styles.tagTypeSelector}>
          <TouchableOpacity 
            style={[
              styles.tagTypeButton,
              { backgroundColor: cardColor, borderColor },
              pelletType === 'negative' && styles.tagTypeButtonActive
            ]}
            onPress={() => setPelletType('negative')}
          >
            <View style={styles.tagTypeIcon}>
              <Target 
                size={16} 
                color={pelletType === 'negative' ? Colors.primary : Colors.textSecondary} 
              />
            </View>
            <Text style={[
              styles.tagTypeText,
              { color: textSecondary },
              pelletType === 'negative' && styles.tagTypeTextActive
            ]}>Negative Tag</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tagTypeButton,
              { backgroundColor: cardColor, borderColor },
              pelletType === 'positive' && styles.tagTypeButtonActive,
              pelletType === 'positive' && styles.positiveTagTypeButtonActive
            ]}
            onPress={() => setPelletType('positive')}
          >
            <View style={styles.tagTypeIcon}>
              <ThumbsUp 
                size={16} 
                color={pelletType === 'positive' ? Colors.success : Colors.textSecondary} 
              />
            </View>
            <Text style={[
              styles.tagTypeText,
              { color: textSecondary },
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
      
      <View style={[styles.badgesSection, { backgroundColor: cardColor, borderColor }]}>
        <View style={styles.badgesHeader}>
          <Text style={[styles.badgesSectionTitle, { color: textColor }]}>Your Badges</Text>
          <View style={[styles.badgeCountContainer, { backgroundColor: isDark ? darkMode.background : Colors.background }]}>
            <Text style={[styles.badgeCountLabel, { color: textSecondary }]}>Unlocked:</Text>
            <Text style={[styles.badgeCount, { color: Colors.primary }]}>
              {userBadges.length} / {badges.length}
            </Text>
          </View>
        </View>
        
        {userBadges.length === 0 ? (
          <View style={styles.emptyBadgeState}>
            <Award size={32} color={textSecondary} />
            <Text style={[styles.emptyBadgeText, { color: textSecondary }]}>No badges yet</Text>
            <Text style={[styles.emptyBadgeSubtext, { color: textSecondary }]}>
              Tag drivers to earn badges
            </Text>
          </View>
        ) : (
          <FlatList
            data={userBadges}
            keyExtractor={(item) => item.id}
            renderItem={renderBadge}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={styles.allBadgesList}
          />
        )}
      </View>
      
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>💥</Text>
        <Text style={[styles.emptyStateText, { color: textColor }]}>Tag Drivers</Text>
        <Text style={[styles.emptyStateSubtext, { color: textSecondary }]}>
          Report bad drivers or give kudos to good ones
        </Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  settingsSection: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  licensePlate: {
    fontSize: 14,
  },
  pelletCountContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  pelletCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pelletCountLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  pelletCountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  positivePelletCount: {
    color: Colors.success,
  },
  tagButtonContainer: {
    marginBottom: 12,
  },
  tagTypeSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tagTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyStateEmoji: {
    fontSize: 36,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: '80%',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
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
  badgesSection: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgesSectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  badgeCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeCountLabel: {
    fontSize: 13,
    marginRight: 4,
  },
  badgeCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyBadgeState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyBadgeSubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  badgeList: {
    paddingBottom: 16,
  },
  allBadgesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  allBadgesList: {
    paddingBottom: 8,
    alignItems: 'center',
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
  driverScoreSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  gaugesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  activitySection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  activityValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});