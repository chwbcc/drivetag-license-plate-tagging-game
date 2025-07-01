import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ScrollView, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { LogOut, Target, AlertTriangle, ShoppingCart, Edit, Award, ThumbsUp, ThumbsDown, TrendingUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import PelletCard from '@/components/PelletCard';
import BadgeCard from '@/components/BadgeCard';
import ExperienceBar from '@/components/ExperienceBar';
import useAuthStore from '@/store/auth-store';
import usePelletStore from '@/store/pellet-store';
import usePaymentStore from '@/store/payment-store';
import useBadgeStore from '@/store/badge-store';

export default function ProfileScreen() {
  const { user, logout, getExpForNextLevel } = useAuthStore();
  const { getPelletsByLicensePlate, getPelletsCreatedByUser } = usePelletStore();
  const { getPurchasesByUser } = usePaymentStore();
  const { getUserBadges, checkAndAwardBadges } = useBadgeStore();
  
  const myNegativePellets = user ? getPelletsByLicensePlate(user.licensePlate, 'negative') : [];
  const myPositivePellets = user ? getPelletsByLicensePlate(user.licensePlate, 'positive') : [];
  const myPurchases = user ? getPurchasesByUser(user.id) : [];
  const myBadges = user ? getUserBadges(user.id) : [];
  const tagsGiven = user ? getPelletsCreatedByUser(user.id) : [];
  
  // Get experience data
  const expData = getExpForNextLevel();
  
  useEffect(() => {
    if (user) {
      // Check for new badges when the profile screen loads
      const newBadges = checkAndAwardBadges(user.id);
      if (newBadges.length > 0) {
        Alert.alert(
          'New Badges Earned!',
          `Congratulations! You've earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}.`,
          [{ text: 'View', onPress: () => router.push('/(tabs)/badges') }]
        );
      }
    }
  }, [user]);
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            logout();
            router.replace('/');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleBuyPellets = () => {
    router.push('/(tabs)/shop');
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };
  
  const handleViewBadges = () => {
    router.push('/(tabs)/badges');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <TouchableOpacity onPress={handleEditProfile}>
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 
                   user?.email ? user.email.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.name}>{user?.name || 'Driver'}</Text>
            <Text style={styles.email}>{user?.email || 'Not logged in'}</Text>
            <View style={styles.licensePlateContainer}>
              <Text style={styles.licensePlateLabel}>License Plate:</Text>
              <Text style={styles.licensePlateValue}>
                {user?.licensePlate || 'N/A'} {user?.state ? `(${user.state})` : ''}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Edit"
            variant="outline"
            onPress={handleEditProfile}
            style={styles.editButton}
            icon={<Edit size={16} color={Colors.primary} style={{ marginRight: 8 }} />}
          />
          <Button
            title="Logout"
            variant="outline"
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </View>
      </View>
      
      {/* Experience Section */}
      <View style={styles.experienceSection}>
        <Text style={styles.sectionTitle}>Experience</Text>
        <ExperienceBar 
          level={user?.level || 1}
          progress={expData.progress}
          currentExp={expData.current}
          nextLevelExp={expData.next}
        />
        
        <View style={styles.expStatsContainer}>
          <View style={styles.expStat}>
            <TrendingUp size={16} color={Colors.primary} />
            <Text style={styles.expStatValue}>{tagsGiven.length}</Text>
            <Text style={styles.expStatLabel}>Reports Made</Text>
          </View>
          <View style={styles.expStat}>
            <Text style={styles.expStatValue}>{user?.exp || 0}</Text>
            <Text style={styles.expStatLabel}>Total EXP</Text>
          </View>
          <View style={styles.expStat}>
            <Text style={styles.expStatValue}>{Math.round(tagsGiven.length ? (user?.exp || 0) / tagsGiven.length : 0)}</Text>
            <Text style={styles.expStatLabel}>Avg EXP/Report</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <ThumbsDown size={16} color={Colors.secondary} />
          </View>
          <Text style={styles.statValue}>{myNegativePellets.length}</Text>
          <Text style={styles.statLabel}>Negative Pellets</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, styles.positiveStatIcon]}>
            <ThumbsUp size={16} color={Colors.success} />
          </View>
          <Text style={[styles.statValue, styles.positiveStatValue]}>
            {myPositivePellets.length}
          </Text>
          <Text style={styles.statLabel}>Positive Pellets</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, styles.badgeStatIcon]}>
            <Award size={16} color="#FFD700" />
          </View>
          <Text style={[styles.statValue, styles.badgeStatValue]}>
            {myBadges.length}
          </Text>
          <Text style={styles.statLabel}>Badges</Text>
        </View>
      </View>
      
      <View style={styles.pelletCountContainer}>
        <View style={styles.pelletCountItem}>
          <Text style={styles.pelletCountLabel}>Negative Pellets:</Text>
          <Text style={styles.pelletCountValue}>{user?.pelletCount || 0}</Text>
        </View>
        <View style={styles.pelletCountItem}>
          <Text style={styles.pelletCountLabel}>Positive Pellets:</Text>
          <Text style={[styles.pelletCountValue, styles.positivePelletCount]}>
            {user?.positivePelletCount || 0}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionContainer}>
        <Button
          title="Buy More Pellets"
          onPress={handleBuyPellets}
          style={styles.buyButton}
          textStyle={styles.buyButtonText}
          icon={<ShoppingCart size={16} color="#fff" style={{ marginRight: 8 }} />}
        />
      </View>
      
      {myBadges.length > 0 && (
        <View style={styles.badgesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Badges</Text>
            <TouchableOpacity onPress={handleViewBadges}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={myBadges.slice(0, 5)} // Show only first 5 badges
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BadgeCard badge={item} size="small" />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesList}
          />
        </View>
      )}
      
      <View style={styles.pelletsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Pellets</Text>
          <View style={styles.pelletTypeIndicator}>
            <View style={styles.indicatorItem}>
              <View style={[styles.indicator, styles.negativeIndicator]} />
              <Text style={styles.indicatorText}>Negative</Text>
            </View>
            <View style={styles.indicatorItem}>
              <View style={[styles.indicator, styles.positiveIndicator]} />
              <Text style={styles.indicatorText}>Positive</Text>
            </View>
          </View>
        </View>
        
        {myNegativePellets.length === 0 && myPositivePellets.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color={Colors.success} />
            <Text style={styles.emptyStateText}>No pellets on your record</Text>
            <Text style={styles.emptyStateSubtext}>
              Keep driving responsibly!
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...myNegativePellets, ...myPositivePellets].sort((a, b) => b.createdAt - a.createdAt)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PelletCard pellet={item} />}
            scrollEnabled={false}
            nestedScrollEnabled={true}
          />
        )}
      </View>
      
      {myPurchases.length > 0 && (
        <View style={styles.purchaseHistoryContainer}>
          <Text style={styles.sectionTitle}>Purchase History</Text>
          {myPurchases.map((purchase) => (
            <View key={purchase.id} style={styles.purchaseItem}>
              <Text style={styles.purchaseDate}>
                {new Date(purchase.date).toLocaleDateString()}
              </Text>
              <Text style={styles.purchaseAmount}>
                ${purchase.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.footer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  licensePlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  licensePlateLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  licensePlateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  experienceSection: {
    marginBottom: 24,
  },
  expStatsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expStat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 4,
  },
  expStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  positiveStatIcon: {
    backgroundColor: Colors.success + '20',
  },
  badgeStatIcon: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  positiveStatValue: {
    color: Colors.success,
  },
  badgeStatValue: {
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  pelletCountContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pelletCountItem: {
    flex: 1,
    alignItems: 'center',
  },
  pelletCountLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  pelletCountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  positivePelletCount: {
    color: Colors.success,
  },
  actionContainer: {
    marginBottom: 24,
  },
  buyButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: '#fff',
  },
  badgesContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
  },
  badgesList: {
    paddingBottom: 8,
  },
  pelletsContainer: {
    marginBottom: 24,
  },
  pelletTypeIndicator: {
    flexDirection: 'row',
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  negativeIndicator: {
    backgroundColor: Colors.secondary,
  },
  positiveIndicator: {
    backgroundColor: Colors.success,
  },
  indicatorText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
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
  purchaseHistoryContainer: {
    marginBottom: 24,
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  purchaseDate: {
    fontSize: 14,
    color: Colors.text,
  },
  purchaseAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  footer: {
    height: 40,
  },
});