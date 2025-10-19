import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { User, Shield, Mail, Car, MapPin } from 'lucide-react-native';
import { useTheme } from '@/store/theme-store';
import useAuthStore from '@/store/auth-store';
import usePelletStore from '@/store/pellet-store';
import useBadgeStore from '@/store/badge-store';
import Colors from '@/constants/colors';
import { darkMode, spacing, fontSize, fontWeight } from '@/constants/styles';
import type { User as UserType } from '@/types';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const allUsers = useAuthStore((state) => state.getAllUsers());
  const pelletStore = usePelletStore();
  const badgeStore = useBadgeStore();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  const getUserStats = (user: UserType) => {
    const negativePelletsReceived = pelletStore.getPelletsByLicensePlate(user.licensePlate, 'negative').length;
    const positivePelletsReceived = pelletStore.getPelletsByLicensePlate(user.licensePlate, 'positive').length;
    const pelletsGiven = pelletStore.getPelletsCreatedByUser(user.id).length;
    const negativePelletsGiven = pelletStore.getPelletsCreatedByUser(user.id, 'negative').length;
    const positivePelletsGiven = pelletStore.getPelletsCreatedByUser(user.id, 'positive').length;

    return {
      negativePelletsReceived,
      positivePelletsReceived,
      pelletsGiven,
      negativePelletsGiven,
      positivePelletsGiven,
    };
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: 'Admin Dashboard',
          headerStyle: {
            backgroundColor: isDark ? darkMode.background : Colors.background,
          },
          headerTintColor: isDark ? darkMode.text : Colors.text,
        }} 
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, isDark && styles.darkIconContainer]}>
            <Shield color={Colors.primary} size={32} />
          </View>
          <Text style={[styles.title, isDark && styles.darkTitle]}>
            Admin Dashboard
          </Text>
          <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
            {allUsers.length} Registered Users
          </Text>
        </View>

        <View style={styles.usersContainer}>
          {allUsers.map((user) => {
            const stats = getUserStats(user);
            const isSelected = selectedUserId === user.id;

            return (
              <View key={user.id}>
                <TouchableOpacity
                  style={[
                    styles.userCard,
                    isDark && styles.darkUserCard,
                    isSelected && styles.selectedCard,
                    isSelected && isDark && styles.darkSelectedCard,
                  ]}
                  onPress={() => setSelectedUserId(isSelected ? null : user.id)}
                >
                  <View style={styles.userHeader}>
                    <View style={[styles.avatarContainer, isDark && styles.darkAvatarContainer]}>
                      <User color={isDark ? darkMode.text : Colors.text} size={24} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, isDark && styles.darkUserName]}>
                        {user.name || 'Anonymous User'}
                      </Text>
                      <View style={styles.emailRow}>
                        <Mail color={isDark ? darkMode.textSecondary : Colors.textSecondary} size={14} />
                        <Text style={[styles.userEmail, isDark && styles.darkUserEmail]}>
                          {user.email}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>Lv.{user.level}</Text>
                    </View>
                  </View>

                  <View style={styles.licensePlateContainer}>
                    <Car color={isDark ? darkMode.textSecondary : Colors.textSecondary} size={16} />
                    <Text style={[styles.licensePlate, isDark && styles.darkLicensePlate]}>
                      {user.licensePlate}
                    </Text>
                    {user.state && (
                      <>
                        <MapPin color={isDark ? darkMode.textSecondary : Colors.textSecondary} size={14} />
                        <Text style={[styles.state, isDark && styles.darkState]}>
                          {user.state}
                        </Text>
                      </>
                    )}
                  </View>

                  <View style={styles.quickStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, isDark && styles.darkStatValue]}>
                        {user.exp}
                      </Text>
                      <Text style={[styles.statLabel, isDark && styles.darkStatLabel]}>
                        EXP
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, isDark && styles.darkStatValue]}>
                        {user.badges?.length || 0}
                      </Text>
                      <Text style={[styles.statLabel, isDark && styles.darkStatLabel]}>
                        Badges
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, isDark && styles.darkStatValue]}>
                        {stats.pelletsGiven}
                      </Text>
                      <Text style={[styles.statLabel, isDark && styles.darkStatLabel]}>
                        Given
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {isSelected && selectedUser && (
                  <View style={[styles.detailsCard, isDark && styles.darkDetailsCard]}>
                    <Text style={[styles.detailsTitle, isDark && styles.darkDetailsTitle]}>
                      User Details
                    </Text>

                    <View style={styles.detailSection}>
                      <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                        Account Information
                      </Text>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          User ID:
                        </Text>
                        <Text style={[styles.detailValue, isDark && styles.darkDetailValue]}>
                          {selectedUser.id}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Email:
                        </Text>
                        <Text style={[styles.detailValue, isDark && styles.darkDetailValue]}>
                          {selectedUser.email}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          License Plate:
                        </Text>
                        <Text style={[styles.detailValue, isDark && styles.darkDetailValue]}>
                          {selectedUser.licensePlate} {selectedUser.state && `(${selectedUser.state})`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                        Progress Stats
                      </Text>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Level:
                        </Text>
                        <Text style={[styles.detailValue, isDark && styles.darkDetailValue]}>
                          {selectedUser.level}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Experience:
                        </Text>
                        <Text style={[styles.detailValue, isDark && styles.darkDetailValue]}>
                          {selectedUser.exp} XP
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Badges Earned:
                        </Text>
                        <Text style={[styles.detailValue, isDark && styles.darkDetailValue]}>
                          {selectedUser.badges?.length || 0}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                        Pellet Inventory
                      </Text>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Negative Pellets:
                        </Text>
                        <Text style={[styles.detailValue, { color: Colors.primary }, isDark && styles.darkDetailValue]}>
                          {selectedUser.pelletCount}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Positive Pellets:
                        </Text>
                        <Text style={[styles.detailValue, { color: Colors.success }]}>
                          {selectedUser.positivePelletCount || 0}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailSection}>
                      <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                        Activity Stats
                      </Text>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Total Pellets Given:
                        </Text>
                        <Text style={[styles.detailValue, isDark && styles.darkDetailValue]}>
                          {stats.pelletsGiven}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Negative Pellets Given:
                        </Text>
                        <Text style={[styles.detailValue, { color: Colors.primary }]}>
                          {stats.negativePelletsGiven}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Positive Pellets Given:
                        </Text>
                        <Text style={[styles.detailValue, { color: Colors.success }]}>
                          {stats.positivePelletsGiven}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Negative Pellets Received:
                        </Text>
                        <Text style={[styles.detailValue, { color: Colors.primary }]}>
                          {stats.negativePelletsReceived}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isDark && styles.darkDetailLabel]}>
                          Positive Pellets Received:
                        </Text>
                        <Text style={[styles.detailValue, { color: Colors.success }]}>
                          {stats.positivePelletsReceived}
                        </Text>
                      </View>
                    </View>

                    {selectedUser.badges && selectedUser.badges.length > 0 && (
                      <View style={styles.detailSection}>
                        <Text style={[styles.sectionTitle, isDark && styles.darkSectionTitle]}>
                          Earned Badges
                        </Text>
                        <View style={styles.badgesList}>
                          {selectedUser.badges.map((badgeId) => {
                            const badge = badgeStore.getBadgeById(badgeId);
                            if (!badge) return null;
                            return (
                              <View key={badgeId} style={[styles.badgeItem, isDark && styles.darkBadgeItem]}>
                                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                                <View style={styles.badgeInfo}>
                                  <Text style={[styles.badgeName, isDark && styles.darkBadgeName]}>
                                    {badge.name}
                                  </Text>
                                  <Text style={[styles.badgeDescription, isDark && styles.darkBadgeDescription]}>
                                    {badge.description}
                                  </Text>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  darkContainer: {
    backgroundColor: darkMode.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  darkIconContainer: {
    backgroundColor: Colors.primary + '25',
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: Colors.text,
    marginBottom: spacing.xs,
  },
  darkTitle: {
    color: darkMode.text,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: Colors.textSecondary,
  },
  darkSubtitle: {
    color: darkMode.textSecondary,
  },
  usersContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  darkUserCard: {
    backgroundColor: darkMode.card,
    borderColor: darkMode.border,
  },
  selectedCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  darkSelectedCard: {
    borderColor: Colors.primary,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkAvatarContainer: {
    backgroundColor: darkMode.surface,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: Colors.text,
    marginBottom: spacing.xs / 2,
  },
  darkUserName: {
    color: darkMode.text,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
  },
  darkUserEmail: {
    color: darkMode.textSecondary,
  },
  levelBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  licensePlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  licensePlate: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: Colors.text,
  },
  darkLicensePlate: {
    color: darkMode.text,
  },
  state: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
  },
  darkState: {
    color: darkMode.textSecondary,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.text,
  },
  darkStatValue: {
    color: darkMode.text,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  darkStatLabel: {
    color: darkMode.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  detailsCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  darkDetailsCard: {
    backgroundColor: darkMode.background,
    borderColor: darkMode.border,
  },
  detailsTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.text,
    marginBottom: spacing.lg,
  },
  darkDetailsTitle: {
    color: darkMode.text,
  },
  detailSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: Colors.primary,
    marginBottom: spacing.sm,
  },
  darkSectionTitle: {
    color: Colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '40',
  },
  detailLabel: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
  },
  darkDetailLabel: {
    color: darkMode.textSecondary,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: Colors.text,
  },
  darkDetailValue: {
    color: darkMode.text,
  },
  badgesList: {
    gap: spacing.sm,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  darkBadgeItem: {
    backgroundColor: darkMode.card,
    borderColor: darkMode.border,
  },
  badgeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: Colors.text,
  },
  darkBadgeName: {
    color: darkMode.text,
  },
  badgeDescription: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
    marginTop: spacing.xs / 2,
  },
  darkBadgeDescription: {
    color: darkMode.textSecondary,
  },
});
