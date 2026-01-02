import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Shield, Users, Target, Activity, Settings, ChevronRight, AlertCircle, Database, CheckCircle, XCircle, WifiOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

export default function AdminAreaScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
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
  
  const pelletsQuery = useQuery({
    queryKey: ['admin-pellets'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('pellets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { pellets: data || [], count: count || 0 };
    },
    enabled: !!user?.adminRole,
    refetchOnMount: true,
  });
  
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
      id: 'backend-check',
      title: 'Backend Status',
      description: 'Check backend connectivity',
      icon: WifiOff,
      color: '#F39C12',
      accessLevel: 'moderator' as const,
    },
    {
      id: 'database-fix',
      title: 'Database Fix',
      description: 'Fix database schema issues',
      icon: Database,
      color: '#9B59B6',
      accessLevel: 'super_admin' as const,
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
    switch(cardId) {
      case 'users':
        router.push('/admin/users');
        break;
      case 'pellets':
        router.push('/admin/pellets');
        break;
      case 'activity':
        router.push('/admin/activity');
        break;
      case 'backend-check':
        router.push('/backend-check');
        break;
      case 'database-fix':
        router.push('/database-fix');
        break;
      case 'settings':
        router.push('/admin/settings');
        break;
    }
  };
  
  const testDatabaseConnection = async () => {
    console.log('🧪 Testing Supabase database connection...');
    setTestLoading(true);
    setTestResult(null);
    
    try {
      const testEmail = `test_${Date.now()}@example.com`;
      const testUser = {
        email: testEmail,
        name: 'Test User',
        passwordhash: 'test_hash_' + Date.now(),
        created_at: new Date().toISOString(),
        pellet_count: 0,
        experience: 0,
        level: 1,
      };
      
      console.log('📝 Attempting to insert test user:', testEmail);
      
      const { data, error } = await supabase
        .from('users')
        .insert([testUser])
        .select();
      
      if (error) {
        console.error('❌ Database insert error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        console.error('❌ Error message:', error.message);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error hint:', error.hint);
        setTestResult({
          success: false,
          message: `Error: ${error.message || JSON.stringify(error)}`,
        });
        Alert.alert('Database Test Failed', error.message || 'Unknown error');
      } else {
        console.log('✅ Test user created successfully:', data);
        setTestResult({
          success: true,
          message: `Successfully created test user: ${testEmail}`,
        });
        Alert.alert('Success!', `Test user created: ${testEmail}`);
      }
    } catch (err) {
      console.error('❌ Database test exception:', err);
      console.error('❌ Exception details:', JSON.stringify(err, null, 2));
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      setTestResult({
        success: false,
        message: `Exception: ${errorMessage}`,
      });
      Alert.alert('Database Test Failed', errorMessage);
    } finally {
      setTestLoading(false);
    }
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
            {usersQuery.isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                {usersQuery.data?.count || 0}
              </Text>
            )}
            <Text style={[styles.statLabel, { color: textSecondary }]}>Total Users</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
            {pelletsQuery.isLoading ? (
              <ActivityIndicator size="small" color={Colors.success} />
            ) : (
              <Text style={[styles.statValue, { color: Colors.success }]}>
                {pelletsQuery.data?.count || 0}
              </Text>
            )}
            <Text style={[styles.statLabel, { color: textSecondary }]}>Total Pellets</Text>
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
            Admin area connected to backend database. All user actions are tracked and stored.
          </Text>
        </View>
        
        <View style={styles.testSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Database Connection Test</Text>
          <View style={[styles.testCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={styles.testHeader}>
              <View style={[styles.iconContainer, { backgroundColor: Colors.primary + '20' }]}>
                <Database size={24} color={Colors.primary} />
              </View>
              <View style={styles.testHeaderContent}>
                <Text style={[styles.testTitle, { color: textColor }]}>Test Supabase Connection</Text>
                <Text style={[styles.testDescription, { color: textSecondary }]}>Create a test user in your Supabase database</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: Colors.primary }]}
              onPress={testDatabaseConnection}
              disabled={testLoading}
            >
              {testLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.testButtonText}>Run Database Test</Text>
              )}
            </TouchableOpacity>
            
            {testResult && (
              <View style={[
                styles.testResultBox,
                { 
                  backgroundColor: testResult.success ? Colors.success + '10' : Colors.error + '10',
                  borderColor: testResult.success ? Colors.success : Colors.error,
                }
              ]}>
                <View style={styles.testResultHeader}>
                  {testResult.success ? (
                    <CheckCircle size={20} color={Colors.success} />
                  ) : (
                    <XCircle size={20} color={Colors.error} />
                  )}
                  <Text style={[
                    styles.testResultTitle,
                    { color: testResult.success ? Colors.success : Colors.error }
                  ]}>
                    {testResult.success ? 'Test Passed' : 'Test Failed'}
                  </Text>
                </View>
                <Text style={[styles.testResultMessage, { color: textColor }]}>
                  {testResult.message}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.userListSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Recent Users</Text>
          {usersQuery.isLoading ? (
            <View style={[styles.emptyState, { backgroundColor: cardColor, borderColor }]}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={[styles.emptyStateText, { color: textSecondary }]}>Loading users...</Text>
            </View>
          ) : usersQuery.data && usersQuery.data.users.length > 0 ? (
            <View style={[styles.userListCard, { backgroundColor: cardColor, borderColor }]}>
              {usersQuery.data.users.slice(0, 5).map((u) => {
                const userRoleColor = u.adminRole === 'super_admin' ? '#FFD700' : u.adminRole === 'admin' ? '#FF6B6B' : u.adminRole === 'moderator' ? '#4ECDC4' : Colors.primary;
                
                return (
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
                      <View style={[styles.miniRoleBadge, { backgroundColor: userRoleColor + '20', borderColor: userRoleColor }]}>
                        <Text style={[styles.miniRoleText, { color: userRoleColor }]}>
                          {u.adminRole.replace('_', ' ')}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: cardColor, borderColor }]}>
              <Users size={32} color={textSecondary} />
              <Text style={[styles.emptyStateText, { color: textSecondary }]}>No users found</Text>
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
  testSection: {
    padding: 16,
    paddingTop: 0,
  },
  testCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  testHeaderContent: {
    flex: 1,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 13,
  },
  testButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  testResultBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  testResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testResultTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  testResultMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
});
