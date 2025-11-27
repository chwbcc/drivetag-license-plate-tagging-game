import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Shield, Users, Target, Activity, Settings, ChevronRight, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';

export default function AdminAreaScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const registeredUsers = useAuthStore(state => state.registeredUsers);
  const allUsers = useAuthStore(state => state.getAllUsers());
  
  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;
  
  if (!user?.adminRole) {
    return (
      <>
        <Stack.Screen options={{ title: 'Access Denied', headerBackTitle: 'Back' }} />
        <View style={[styles.container, { backgroundColor: bgColor }]}>
          <View style={styles.accessDeniedContainer}>
            <AlertCircle size={64} color={Colors.error} />
            <Text style={[styles.accessDeniedTitle, { color: textColor }]}>Access Denied</Text>
            <Text style={[styles.accessDeniedText, { color: textSecondary }]}>
              You do not have permission to access the admin area.
            </Text>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: Colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }
  
  const isSuperAdmin = user.adminRole === 'super_admin';
  const isAdmin = user.adminRole === 'admin' || isSuperAdmin;
  const isModerator = user.adminRole === 'moderator' || isAdmin;
  
  const roleColor = isSuperAdmin ? '#FFD700' : isAdmin ? '#FF6B6B' : '#4ECDC4';
  const roleText = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Moderator';
  
  const adminCards = [
    {
      id: 'users',
      title: 'User Management',
      description: 'View and manage all users',
      icon: Users,
      color: '#4ECDC4',
      accessLevel: 'moderator' as const,
    },
    {
      id: 'pellets',
      title: 'Pellet Reports',
      description: 'View all driver reports',
      icon: Target,
      color: '#FF6B6B',
      accessLevel: 'moderator' as const,
    },
    {
      id: 'activity',
      title: 'User Activity',
      description: 'Monitor user actions',
      icon: Activity,
      color: '#95E1D3',
      accessLevel: 'admin' as const,
    },
    {
      id: 'settings',
      title: 'Admin Settings',
      description: 'Configure admin roles',
      icon: Settings,
      color: '#FFD700',
      accessLevel: 'super_admin' as const,
    },
  ];
  
  const canAccess = (accessLevel: 'moderator' | 'admin' | 'super_admin') => {
    if (accessLevel === 'moderator') return isModerator;
    if (accessLevel === 'admin') return isAdmin;
    if (accessLevel === 'super_admin') return isSuperAdmin;
    return false;
  };
  
  const handleCardPress = (cardId: string) => {
    Alert.alert(
      'Admin Feature',
      `This would open the ${cardId} management interface. This is a placeholder - in production, this would connect to your backend database.`,
      [{ text: 'OK' }]
    );
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Admin Area',
          headerBackTitle: 'Back'
        }} 
      />
      
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.headerContent}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + '20', borderColor: roleColor }]}>
              <Shield size={20} color={roleColor} />
              <Text style={[styles.roleText, { color: roleColor }]}>{roleText}</Text>
            </View>
            <Text style={[styles.welcomeText, { color: textColor }]}>Welcome, {user.name || user.email}</Text>
            <Text style={[styles.descriptionText, { color: textSecondary }]}>
              {isSuperAdmin 
                ? 'You have full access to all admin features' 
                : isAdmin 
                ? 'You can manage users and view activity' 
                : 'You can view users and reports'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
            <Text style={[styles.statValue, { color: Colors.primary }]}>{registeredUsers.length}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Registered Users</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{allUsers.length}</Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Total Users</Text>
          </View>
        </View>
        
        <View style={styles.cardsContainer}>
          {adminCards.map((card) => {
            const hasAccess = canAccess(card.accessLevel);
            const Icon = card.icon;
            
            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.adminCard,
                  { backgroundColor: cardColor, borderColor },
                  !hasAccess && styles.disabledCard,
                ]}
                onPress={() => hasAccess && handleCardPress(card.id)}
                disabled={!hasAccess}
              >
                <View style={[styles.iconContainer, { backgroundColor: card.color + '20' }]}>
                  <Icon size={24} color={hasAccess ? card.color : textSecondary} />
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: hasAccess ? textColor : textSecondary }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.cardDescription, { color: textSecondary }]}>
                    {card.description}
                  </Text>
                  {!hasAccess && (
                    <Text style={[styles.accessLevelText, { color: Colors.error }]}>
                      Requires {card.accessLevel.replace('_', ' ')} access
                    </Text>
                  )}
                </View>
                
                {hasAccess && (
                  <ChevronRight size={20} color={textSecondary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={[styles.infoBox, { backgroundColor: cardColor, borderColor }]}>
          <AlertCircle size={20} color={Colors.primary} />
          <Text style={[styles.infoText, { color: textSecondary }]}>
            This is a demo admin interface. In production, these features would connect to your backend database 
            to manage real user data, reports, and system settings.
          </Text>
        </View>
        
        <View style={styles.userListSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Users</Text>
          {registeredUsers.length > 0 ? (
            <View style={[styles.userListCard, { backgroundColor: cardColor, borderColor }]}>
              {registeredUsers.slice(0, 5).map((u, index) => (
                <View key={u.id} style={styles.userItem}>
                  <View style={styles.userInfo}>
                    <View style={[styles.userAvatar, { backgroundColor: Colors.primary + '20' }]}>
                      <Text style={[styles.userAvatarText, { color: Colors.primary }]}>
                        {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={[styles.userName, { color: textColor }]}>{u.name || 'No name'}</Text>
                      <Text style={[styles.userEmail, { color: textSecondary }]}>{u.email}</Text>
                    </View>
                  </View>
                  {u.adminRole && (
                    <View style={[styles.miniRoleBadge, { backgroundColor: roleColor + '20', borderColor: roleColor }]}>
                      <Text style={[styles.miniRoleText, { color: roleColor }]}>
                        {u.adminRole.replace('_', ' ')}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: cardColor, borderColor }]}>
              <Users size={32} color={textSecondary} />
              <Text style={[styles.emptyStateText, { color: textSecondary }]}>No registered users yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginLeft: 6,
    textTransform: 'uppercase' as const,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center' as const,
  },
  cardsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  disabledCard: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
  },
  accessLevelText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  userListSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  userListCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  miniRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniRoleText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: 12,
  },
});
