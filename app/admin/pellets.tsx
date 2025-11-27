import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Target, User, MapPin, Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { trpc } from '@/lib/trpc';

export default function PelletReportsScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  
  const pelletsQuery = trpc.admin.getAllPellets.useQuery(undefined, {
    enabled: !!user?.adminRole,
    refetchOnMount: true,
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
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Pellet Reports',
          headerBackTitle: 'Admin'
        }} 
      />
      
      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.headerRow}>
            <Target size={24} color={Colors.success} />
            <Text style={[styles.headerTitle, { color: textColor }]}>All Pellet Reports</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            {pelletsQuery.data?.count || 0} total reports
          </Text>
        </View>
        
        {pelletsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.success} />
            <Text style={[styles.loadingText, { color: textSecondary }]}>Loading reports...</Text>
          </View>
        ) : pelletsQuery.data && pelletsQuery.data.pellets.length > 0 ? (
          <View style={styles.pelletsList}>
            {pelletsQuery.data.pellets.map((pellet) => (
              <View key={pellet.id} style={[styles.pelletCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={styles.pelletHeader}>
                  <View style={[styles.pelletIcon, { backgroundColor: Colors.success + '20' }]}>
                    <Target size={20} color={Colors.success} />
                  </View>
                  <View style={styles.pelletInfo}>
                    <Text style={[styles.licensePlate, { color: textColor }]}>
                      {pellet.licensePlate}
                    </Text>
                    <Text style={[styles.pelletDate, { color: textSecondary }]}>
                      {formatDate(pellet.createdAt)}
                    </Text>
                  </View>
                </View>
                
                {pellet.notes && (
                  <View style={styles.notesSection}>
                    <Text style={[styles.notesLabel, { color: textSecondary }]}>Notes:</Text>
                    <Text style={[styles.notesText, { color: textColor }]}>{pellet.notes}</Text>
                  </View>
                )}
                
                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <User size={14} color={textSecondary} />
                    <Text style={[styles.detailLabel, { color: textSecondary }]}>Reported by:</Text>
                    <Text style={[styles.detailValue, { color: textColor }]}>
                      {pellet.userEmail || 'Unknown'}
                    </Text>
                  </View>
                  
                  {pellet.location && (
                    <View style={styles.detailRow}>
                      <MapPin size={14} color={textSecondary} />
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Location:</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>
                        {pellet.location.latitude.toFixed(4)}, {pellet.location.longitude.toFixed(4)}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.detailRow}>
                    <Calendar size={14} color={textSecondary} />
                    <Text style={[styles.detailLabel, { color: textSecondary }]}>ID:</Text>
                    <Text style={[styles.detailValue, { color: textColor, fontSize: 10 }]}>
                      {pellet.id}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: cardColor, borderColor }]}>
            <Target size={48} color={textSecondary} />
            <Text style={[styles.emptyStateText, { color: textSecondary }]}>No pellet reports found</Text>
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
  pelletsList: {
    padding: 16,
  },
  pelletCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  pelletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pelletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pelletInfo: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  pelletDate: {
    fontSize: 12,
  },
  notesSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: Colors.background + '40',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  detailsSection: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    width: 90,
  },
  detailValue: {
    fontSize: 12,
    flex: 1,
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
