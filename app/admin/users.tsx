import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Users, Shield, Mail, Calendar, ChevronRight, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { trpc } from '@/lib/trpc';

export default function UserManagementScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  
  const usersQuery = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: !!user?.adminRole,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  console.log('[AdminUsers] Users query status:', {
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error?.message,
    count: usersQuery.data?.count,
    usersLength: usersQuery.data?.users?.length,
  });
  
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      usersQuery.refetch();
      Alert.alert('Success', 'User role updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update user role');
    },
  });
  
  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;
  
  if (!user?.adminRole) {
    router.replace('/');
    return null;
  }
  
  const isSuperAdmin = user.adminRole === 'super_admin';
  const isAdmin = user.adminRole === 'admin' || isSuperAdmin;
  
  const handleChangeRole = (userId: string, currentRole: string | null) => {
    if (!isAdmin) {
      Alert.alert('Permission Denied', 'Only admins can change user roles');
      return;
    }
    
    const roles = ['user', 'moderator', 'admin', 'super_admin'];
    const roleLabels = ['User', 'Moderator', 'Admin', 'Super Admin'];
    
    const availableRoles = isSuperAdmin ? roles : roles.filter(r => r !== 'super_admin');
    const availableLabels = isSuperAdmin ? roleLabels : roleLabels.filter((_, i) => roles[i] !== 'super_admin');
    
    Alert.alert(
      'Change User Role',
      'Select a new role for this user',
      [
        ...availableRoles.map((role, index) => ({
          text: availableLabels[index],
          onPress: () => {
            updateRoleMutation.mutate({
              userId,
              adminRole: role === 'user' ? null : role as 'moderator' | 'admin' | 'super_admin',
            });
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'User Management',
          headerBackTitle: 'Admin'
        }} 
      />
      
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.headerRow}>
            <Users size={24} color={Colors.primary} />
            <Text style={[styles.headerTitle, { color: textColor }]}>All Users</Text>
            <TouchableOpacity
              onPress={() => usersQuery.refetch()}
              style={styles.refreshButton}
              disabled={usersQuery.isRefetching}
            >
              <RefreshCw 
                size={20} 
                color={usersQuery.isRefetching ? textSecondary : Colors.primary}
                style={usersQuery.isRefetching ? styles.spinning : undefined}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            {usersQuery.data?.count || 0} total users
          </Text>
        </View>
        
        {usersQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: textSecondary }]}>Loading users...</Text>
          </View>
        ) : usersQuery.data && usersQuery.data.users.length > 0 ? (
          <View style={styles.usersList}>
            {usersQuery.data.users.map((u) => {
              const userRoleColor = u.adminRole === 'super_admin' 
                ? '#FFD700' 
                : u.adminRole === 'admin' 
                ? '#FF6B6B' 
                : u.adminRole === 'moderator' 
                ? '#4ECDC4' 
                : Colors.primary;
              
              const isExpanded = selectedUser === u.id;
              
              return (
                <View key={u.id} style={[styles.userCard, { backgroundColor: cardColor, borderColor }]}>
                  <TouchableOpacity
                    onPress={() => setSelectedUser(isExpanded ? null : u.id)}
                    style={styles.userCardHeader}
                  >
                    <View style={styles.userMainInfo}>
                      <View style={[styles.userAvatar, { backgroundColor: userRoleColor + '20' }]}>
                        <Text style={[styles.userAvatarText, { color: userRoleColor }]}>
                          {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      
                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: textColor }]}>
                          {u.name || 'No name'}
                        </Text>
                        <View style={styles.userEmailRow}>
                          <Mail size={12} color={textSecondary} />
                          <Text style={[styles.userEmail, { color: textSecondary }]}>{u.email}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.userActions}>
                      {u.adminRole && (
                        <View style={[styles.roleBadge, { backgroundColor: userRoleColor + '20', borderColor: userRoleColor }]}>
                          <Shield size={10} color={userRoleColor} />
                          <Text style={[styles.roleText, { color: userRoleColor }]}>
                            {u.adminRole.replace('_', ' ')}
                          </Text>
                        </View>
                      )}
                      <ChevronRight 
                        size={20} 
                        color={textSecondary}
                        style={[
                          styles.chevron,
                          isExpanded && styles.chevronExpanded
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={[styles.userDetails, { borderTopColor: borderColor }]}>
                      {u.createdAt && (
                        <View style={styles.detailRow}>
                          <Calendar size={16} color={textSecondary} />
                          <Text style={[styles.detailLabel, { color: textSecondary }]}>Joined:</Text>
                          <Text style={[styles.detailValue, { color: textColor }]}>
                            {formatDate(u.createdAt)}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.detailRow}>
                        <Shield size={16} color={textSecondary} />
                        <Text style={[styles.detailLabel, { color: textSecondary }]}>Role:</Text>
                        <Text style={[styles.detailValue, { color: textColor }]}>
                          {u.adminRole ? u.adminRole.replace('_', ' ') : 'Regular User'}
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Mail size={16} color={textSecondary} />
                        <Text style={[styles.detailLabel, { color: textSecondary }]}>User ID:</Text>
                        <Text style={[styles.detailValue, { color: textColor, fontSize: 10 }]}>
                          {u.id}
                        </Text>
                      </View>
                      
                      {isAdmin && u.id !== user.id && (
                        <TouchableOpacity
                          style={[styles.changeRoleButton, { backgroundColor: Colors.primary }]}
                          onPress={() => handleChangeRole(u.id, u.adminRole || null)}
                          disabled={updateRoleMutation.isPending}
                        >
                          {updateRoleMutation.isPending ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.changeRoleButtonText}>Change Role</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: cardColor, borderColor }]}>
            <Users size={48} color={textSecondary} />
            <Text style={[styles.emptyStateText, { color: textSecondary }]}>No users found</Text>
          </View>
        )}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  spinning: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  headerSubtitle: {
    fontSize: 14,
    marginLeft: 36,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  usersList: {
    padding: 16,
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  userMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  userEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userEmail: {
    fontSize: 13,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  chevron: {
    transform: [{ rotate: '0deg' }] as const,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }] as const,
  },
  userDetails: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    width: 70,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
  },
  changeRoleButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeRoleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyState: {
    margin: 16,
    padding: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    marginTop: 12,
  },
});
