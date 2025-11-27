import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, router } from 'expo-router';
import { Settings, AlertCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';

export default function AdminSettingsScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  
  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;
  
  if (user?.adminRole !== 'super_admin') {
    router.replace('/admin');
    return null;
  }
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Admin Settings',
          headerBackTitle: 'Admin'
        }} 
      />
      
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.headerRow}>
            <Settings size={24} color={Colors.error} />
            <Text style={[styles.headerTitle, { color: textColor }]}>Admin Configuration</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Manage admin settings and permissions
          </Text>
        </View>
        
        <View style={[styles.comingSoonCard, { backgroundColor: cardColor, borderColor }]}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={[styles.comingSoonTitle, { color: textColor }]}>Coming Soon</Text>
          <Text style={[styles.comingSoonText, { color: textSecondary }]}>
            Advanced admin settings will be available in the next update. This will include role management, permissions configuration, and more.
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
