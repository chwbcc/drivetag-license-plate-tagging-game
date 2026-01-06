import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { Users, Shield, Mail, Calendar, ChevronRight, Plus, Edit, Car, Hash } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { User } from '@/types';

type UserFormData = {
  email: string;
  name: string;
  licensePlate: string;
  state: string;
  pelletCount: string;
  positivePelletCount: string;
  exp: string;
  level: string;
  adminRole: 'user' | 'moderator' | 'admin' | 'super_admin';
};

export default function UserManagementScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    licensePlate: '',
    state: '',
    pelletCount: '10',
    positivePelletCount: '5',
    exp: '0',
    level: '1',
    adminRole: 'user',
  });
  
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { users: data || [], count: count || 0 };
    },
    enabled: !!user?.adminRole,
    refetchOnMount: true,
  });
  
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, adminRole }: { userId: string; adminRole: string | null }) => {
      const { error } = await supabase
        .from('users')
        .update({ role: adminRole || 'user' })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      usersQuery.refetch();
      Alert.alert('Success', 'User role updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update user role');
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[CreateUser] Starting user creation:', {
        userId,
        email: data.email,
        role: data.adminRole || 'user',
      });
      
      const { error: usersError } = await supabase
        .from('users')
        .insert([{
          id: userId,
          email: data.email,
          username: data.name || 'Anonymous',
          name: data.name || '',
          created_at: Date.now(),
          role: data.adminRole || 'user',
          license_plate: data.licensePlate || null,
          state: data.state || null,
          experience: data.exp,
          level: data.level,
          negative_pellet_count: data.pelletCount,
          positive_pellet_count: data.positivePelletCount,
          badges: JSON.stringify([]),
          photo: null,
        }]);
      
      if (usersError) {
        console.error('[CreateUser] Failed to insert into users table:', usersError);
        console.error('[CreateUser] Error details:', JSON.stringify(usersError, null, 2));
        throw new Error(`Failed to create user in users table: ${usersError.message}`);
      }
      
      console.log('[CreateUser] User created successfully:', userId);
    },
    onSuccess: () => {
      usersQuery.refetch();
      setShowCreateModal(false);
      resetForm();
      Alert.alert('Success', 'User created successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const updates: any = {
        username: data.name,
        name: data.name,
        license_plate: data.licensePlate,
        state: data.state,
        negative_pellet_count: data.pelletCount,
        positive_pellet_count: data.positivePelletCount,
        experience: data.exp,
        level: data.level,
        role: data.adminRole || 'user',
      };
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', data.userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      usersQuery.refetch();
      setShowEditModal(false);
      setEditingUser(null);
      resetForm();
      Alert.alert('Success', 'User updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update user');
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

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      licensePlate: '',
      state: '',
      pelletCount: '10',
      positivePelletCount: '5',
      exp: '0',
      level: '1',
      adminRole: 'user',
    });
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      name: u.name || '',
      licensePlate: u.licensePlate || '',
      state: u.state || '',
      pelletCount: String(u.pelletCount),
      positivePelletCount: String(u.positivePelletCount),
      exp: String(u.exp),
      level: String(u.level),
      adminRole: (u.adminRole || 'user') as any,
    });
    setShowEditModal(true);
  };

  const handleCreateUser = () => {
    if (!formData.email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    createUserMutation.mutate({
      email: formData.email,
      name: formData.name || undefined,
      licensePlate: formData.licensePlate || undefined,
      state: formData.state || undefined,
      pelletCount: parseInt(formData.pelletCount) || 10,
      positivePelletCount: parseInt(formData.positivePelletCount) || 5,
      exp: parseInt(formData.exp) || 0,
      level: parseInt(formData.level) || 1,
      adminRole: formData.adminRole === 'user' ? undefined : formData.adminRole,
    });
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    const updates: any = {
      userId: editingUser.id,
      name: formData.name || undefined,
      licensePlate: formData.licensePlate || undefined,
      state: formData.state || undefined,
      pelletCount: parseInt(formData.pelletCount),
      positivePelletCount: parseInt(formData.positivePelletCount),
      exp: parseInt(formData.exp),
      level: parseInt(formData.level),
      adminRole: formData.adminRole,
    };

    updateUserMutation.mutate(updates);
  };
  
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

  const renderUserForm = (isEdit: boolean) => (
    <View style={styles.formContainer}>
      <Text style={[styles.formLabel, { color: textColor }]}>Email</Text>
      <TextInput
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        placeholder="user@example.com"
        placeholderTextColor={textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isEdit}
      />

      <Text style={[styles.formLabel, { color: textColor }]}>Name</Text>
      <TextInput
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="John Doe"
        placeholderTextColor={textSecondary}
      />

      <Text style={[styles.formLabel, { color: textColor }]}>License Plate</Text>
      <TextInput
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
        value={formData.licensePlate}
        onChangeText={(text) => setFormData({ ...formData, licensePlate: text })}
        placeholder="ABC123"
        placeholderTextColor={textSecondary}
        autoCapitalize="characters"
      />

      <Text style={[styles.formLabel, { color: textColor }]}>State</Text>
      <TextInput
        style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
        value={formData.state}
        onChangeText={(text) => setFormData({ ...formData, state: text })}
        placeholder="CA"
        placeholderTextColor={textSecondary}
        autoCapitalize="characters"
        maxLength={2}
      />

      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Text style={[styles.formLabel, { color: textColor }]}>Pellets</Text>
          <TextInput
            style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
            value={formData.pelletCount}
            onChangeText={(text) => setFormData({ ...formData, pelletCount: text })}
            placeholder="10"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={[styles.formLabel, { color: textColor }]}>Positive Pellets</Text>
          <TextInput
            style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
            value={formData.positivePelletCount}
            onChangeText={(text) => setFormData({ ...formData, positivePelletCount: text })}
            placeholder="5"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Text style={[styles.formLabel, { color: textColor }]}>EXP</Text>
          <TextInput
            style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
            value={formData.exp}
            onChangeText={(text) => setFormData({ ...formData, exp: text })}
            placeholder="0"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={[styles.formLabel, { color: textColor }]}>Level</Text>
          <TextInput
            style={[styles.input, { backgroundColor: cardColor, color: textColor, borderColor }]}
            value={formData.level}
            onChangeText={(text) => setFormData({ ...formData, level: text })}
            placeholder="1"
            placeholderTextColor={textSecondary}
            keyboardType="numeric"
          />
        </View>
      </View>

      <Text style={[styles.formLabel, { color: textColor }]}>Role</Text>
      <View style={styles.roleSelector}>
        {(['user', 'moderator', 'admin', ...(isSuperAdmin ? ['super_admin' as const] : [])] as ('user' | 'moderator' | 'admin' | 'super_admin')[]).map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.roleOption,
              { backgroundColor: cardColor, borderColor },
              formData.adminRole === role && { backgroundColor: Colors.primary, borderColor: Colors.primary }
            ]}
            onPress={() => setFormData({ ...formData, adminRole: role })}
          >
            <Text style={[
              styles.roleOptionText,
              { color: textColor },
              formData.adminRole === role && { color: '#fff' }
            ]}>
              {role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.formButtons}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: cardColor, borderColor }]}
          onPress={() => {
            if (isEdit) {
              setShowEditModal(false);
              setEditingUser(null);
            } else {
              setShowCreateModal(false);
            }
            resetForm();
          }}
        >
          <Text style={[styles.cancelButtonText, { color: textColor }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: Colors.primary }]}
          onPress={isEdit ? handleUpdateUser : handleCreateUser}
          disabled={isEdit ? updateUserMutation.isPending : createUserMutation.isPending}
        >
          {(isEdit ? updateUserMutation.isPending : createUserMutation.isPending) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{isEdit ? 'Update User' : 'Create User'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'User Management',
          headerBackTitle: 'Admin',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.headerButton}
            >
              <Plus size={24} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.headerRow}>
            <Users size={24} color={Colors.primary} />
            <Text style={[styles.headerTitle, { color: textColor }]}>All Users</Text>
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
                        <Car size={16} color={textSecondary} />
                        <Text style={[styles.detailLabel, { color: textSecondary }]}>Plate:</Text>
                        <Text style={[styles.detailValue, { color: textColor }]}>
                          {u.licensePlate || 'Not set'}{u.state ? ` (${u.state})` : ''}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Hash size={16} color={textSecondary} />
                        <Text style={[styles.detailLabel, { color: textSecondary }]}>Pellets:</Text>
                        <Text style={[styles.detailValue, { color: textColor }]}>
                          {u.pelletCount} / {u.positivePelletCount} positive
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Hash size={16} color={textSecondary} />
                        <Text style={[styles.detailLabel, { color: textSecondary }]}>Level:</Text>
                        <Text style={[styles.detailValue, { color: textColor }]}>
                          Level {u.level} ({u.exp} EXP)
                        </Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Mail size={16} color={textSecondary} />
                        <Text style={[styles.detailLabel, { color: textSecondary }]}>User ID:</Text>
                        <Text style={[styles.detailValue, { color: textColor, fontSize: 10 }]}>
                          {u.id}
                        </Text>
                      </View>

                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.editButton, { backgroundColor: Colors.primary }]}
                          onPress={() => openEditModal(u)}
                        >
                          <Edit size={16} color="#fff" />
                          <Text style={styles.editButtonText}>Edit User</Text>
                        </TouchableOpacity>
                        
                        {isAdmin && u.id !== user.id && (
                          <TouchableOpacity
                            style={[styles.changeRoleButton, { backgroundColor: cardColor, borderColor }]}
                            onPress={() => handleChangeRole(u.id, u.adminRole || null)}
                            disabled={updateRoleMutation.isPending}
                          >
                            {updateRoleMutation.isPending ? (
                              <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                              <Text style={[styles.changeRoleButtonText, { color: textColor }]}>Change Role</Text>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
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

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Create New User</Text>
            <ScrollView style={styles.modalScroll}>
              {renderUserForm(false)}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Edit User</Text>
            <ScrollView style={styles.modalScroll}>
              {renderUserForm(true)}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  headerSubtitle: {
    fontSize: 14,
    marginLeft: 36,
  },
  headerButton: {
    marginRight: 8,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  changeRoleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  changeRoleButtonText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalScroll: {
    paddingHorizontal: 24,
  },
  formContainer: {
    paddingBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  roleOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
