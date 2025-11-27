import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Activity, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';

export default function UserActivityScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  
  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;
  
  if (!user?.adminRole || (user.adminRole !== 'admin' && user.adminRole !== 'super_admin')) {
    router.replace('/admin');
    return null;
  }
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'User Activity',
          headerBackTitle: 'Admin'
        }} 
      />
      
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.headerRow}>
            <Activity size={24} color={Colors.warning} />
            <Text style={[styles.headerTitle, { color: textColor }]}>User Activity Monitor</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Track and analyze user actions
          </Text>
        </View>
        
        <View style={[styles.comingSoonCard, { backgroundColor: cardColor, borderColor }]}>
          <AlertCircle size={48} color={Colors.warning} />
          <Text style={[styles.comingSoonTitle, { color: textColor }]}>Coming Soon</Text>
          <Text style={[styles.comingSoonText, { color: textSecondary }]}>
            Activity tracking will be available in the next update. This feature will allow you to monitor user actions in real-time.
          </Text>
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
  comingSoonCard: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
