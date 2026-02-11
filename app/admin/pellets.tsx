import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { Stack, router } from 'expo-router';
import { Target, User, MapPin, Calendar, TrendingUp, TrendingDown, BarChart3, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { hashLicensePlate } from '@/utils/hash';

export default function PelletReportsScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  
  const pelletsQuery = useQuery({
    queryKey: ['admin-pellets'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('pellets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[AdminPellets] Query error:', error);
        throw error;
      }

      const pellets = data || [];
      const creatorIds = [...new Set(pellets.map((p: any) => p.created_by).filter(Boolean))];
      
      let usersMap: Record<string, any> = {};
      if (creatorIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, license_plate, username, name')
          .in('id', creatorIds);
        
        if (!usersError && usersData) {
          usersData.forEach((u: any) => {
            usersMap[u.id] = u;
          });
        } else {
          console.warn('[AdminPellets] Could not fetch users:', usersError);
        }
      }

      const enrichedPellets = pellets.map((p: any) => ({
        ...p,
        reporter: usersMap[p.created_by] || null,
      }));

      return { pellets: enrichedPellets, count: count || 0 };
    },
    enabled: !!user?.adminRole,
    refetchOnMount: true,
  });
  
  const [showPositiveSubs, setShowPositiveSubs] = useState(true);
  const [showNegativeSubs, setShowNegativeSubs] = useState(true);

  const analytics = useMemo(() => {
    if (!pelletsQuery.data?.pellets) return null;
    const pellets = pelletsQuery.data.pellets;
    const total = pellets.length;
    const positive = pellets.filter((p: any) => p.type === 'positive');
    const negative = pellets.filter((p: any) => p.type === 'negative');

    const groupByReason = (items: any[]) => {
      const map: Record<string, number> = {};
      items.forEach((p) => {
        const reason = (p.notes || 'No reason provided').trim();
        map[reason] = (map[reason] || 0) + 1;
      });
      return Object.entries(map)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);
    };

    return {
      total,
      positiveCount: positive.length,
      negativeCount: negative.length,
      positivePercent: total > 0 ? Math.round((positive.length / total) * 100) : 0,
      negativePercent: total > 0 ? Math.round((negative.length / total) * 100) : 0,
      positiveReasons: groupByReason(positive),
      negativeReasons: groupByReason(negative),
    };
  }, [pelletsQuery.data]);

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
        
        {analytics && !pelletsQuery.isLoading && (
          <View style={styles.analyticsSection}>
            <View style={[styles.analyticsSummary, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.analyticsTitleRow}>
                <BarChart3 size={20} color={Colors.primary} />
                <Text style={[styles.analyticsTitle, { color: textColor }]}>Pellet Breakdown</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: '#10B98115' }]}> 
                  <TrendingUp size={22} color="#10B981" />
                  <Text style={[styles.summaryCount, { color: '#10B981' }]}>{analytics.positiveCount}</Text>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Positive</Text>
                  <Text style={[styles.summaryPercent, { color: '#10B981' }]}>{analytics.positivePercent}%</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#EF444415' }]}> 
                  <TrendingDown size={22} color="#EF4444" />
                  <Text style={[styles.summaryCount, { color: '#EF4444' }]}>{analytics.negativeCount}</Text>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Negative</Text>
                  <Text style={[styles.summaryPercent, { color: '#EF4444' }]}>{analytics.negativePercent}%</Text>
                </View>
              </View>

              <View style={styles.barContainer}>
                <View style={[styles.barTrack, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                  <View style={[styles.barFillPositive, { width: `${analytics.positivePercent}%` }]} />
                  <View style={[styles.barFillNegative, { width: `${analytics.negativePercent}%` }]} />
                </View>
              </View>
            </View>

            <View style={[styles.subcategoryCard, { backgroundColor: cardColor, borderColor }]}>
              <TouchableOpacity
                style={styles.subcategoryHeader}
                onPress={() => setShowPositiveSubs(!showPositiveSubs)}
                activeOpacity={0.7}
              >
                <View style={styles.subcategoryTitleRow}>
                  <View style={[styles.dotIndicator, { backgroundColor: '#10B981' }]} />
                  <Text style={[styles.subcategoryTitle, { color: textColor }]}>
                    Positive Reasons ({analytics.positiveReasons.length})
                  </Text>
                </View>
                {showPositiveSubs ? (
                  <ChevronUp size={18} color={textSecondary} />
                ) : (
                  <ChevronDown size={18} color={textSecondary} />
                )}
              </TouchableOpacity>
              {showPositiveSubs && (
                <View style={styles.subcategoryList}>
                  {analytics.positiveReasons.length === 0 ? (
                    <Text style={[styles.emptySubText, { color: textSecondary }]}>No positive pellets yet</Text>
                  ) : (
                    analytics.positiveReasons.map((item, idx) => (
                      <View key={`pos-${idx}`} style={[styles.reasonRow, idx < analytics.positiveReasons.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                        <View style={styles.reasonInfo}>
                          <Text style={[styles.reasonText, { color: textColor }]} numberOfLines={2}>{item.reason}</Text>
                        </View>
                        <View style={styles.reasonCountContainer}>
                          <Text style={[styles.reasonCount, { color: '#10B981' }]}>{item.count}</Text>
                          <View style={[styles.reasonBar, { backgroundColor: '#10B98120' }]}>
                            <View style={[styles.reasonBarFill, { width: `${Math.min(100, (item.count / analytics.positiveCount) * 100)}%`, backgroundColor: '#10B981' }]} />
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            <View style={[styles.subcategoryCard, { backgroundColor: cardColor, borderColor }]}>
              <TouchableOpacity
                style={styles.subcategoryHeader}
                onPress={() => setShowNegativeSubs(!showNegativeSubs)}
                activeOpacity={0.7}
              >
                <View style={styles.subcategoryTitleRow}>
                  <View style={[styles.dotIndicator, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.subcategoryTitle, { color: textColor }]}>
                    Negative Reasons ({analytics.negativeReasons.length})
                  </Text>
                </View>
                {showNegativeSubs ? (
                  <ChevronUp size={18} color={textSecondary} />
                ) : (
                  <ChevronDown size={18} color={textSecondary} />
                )}
              </TouchableOpacity>
              {showNegativeSubs && (
                <View style={styles.subcategoryList}>
                  {analytics.negativeReasons.length === 0 ? (
                    <Text style={[styles.emptySubText, { color: textSecondary }]}>No negative pellets yet</Text>
                  ) : (
                    analytics.negativeReasons.map((item, idx) => (
                      <View key={`neg-${idx}`} style={[styles.reasonRow, idx < analytics.negativeReasons.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                        <View style={styles.reasonInfo}>
                          <Text style={[styles.reasonText, { color: textColor }]} numberOfLines={2}>{item.reason}</Text>
                        </View>
                        <View style={styles.reasonCountContainer}>
                          <Text style={[styles.reasonCount, { color: '#EF4444' }]}>{item.count}</Text>
                          <View style={[styles.reasonBar, { backgroundColor: '#EF444420' }]}>
                            <View style={[styles.reasonBarFill, { width: `${Math.min(100, (item.count / analytics.negativeCount) * 100)}%`, backgroundColor: '#EF4444' }]} />
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          </View>
        )}

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
                      {pellet.license_plate ? hashLicensePlate(pellet.license_plate) : 'N/A'}
                    </Text>
                    <Text style={[styles.pelletDate, { color: textSecondary }]}>
                      {formatDate(new Date(pellet.created_at).getTime())}
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
                      {pellet.reporter && typeof pellet.reporter === 'object' && !Array.isArray(pellet.reporter)
                        ? hashLicensePlate((pellet.reporter as any).license_plate || (pellet.reporter as any).username || (pellet.reporter as any).name || '')
                        : pellet.created_by ? hashLicensePlate(pellet.created_by) : 'Unknown'}
                    </Text>
                  </View>
                  
                  {pellet.location && pellet.location.latitude && pellet.location.longitude && (
                    <View style={styles.detailRow}>
                      <MapPin size={14} color={textSecondary} />
                      <Text style={[styles.detailLabel, { color: textSecondary }]}>Location:</Text>
                      <Text style={[styles.detailValue, { color: textColor }]}>
                        {typeof pellet.location.latitude === 'number' && typeof pellet.location.longitude === 'number'
                          ? `${pellet.location.latitude.toFixed(4)}, ${pellet.location.longitude.toFixed(4)}`
                          : 'Location recorded'}
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
  analyticsSection: {
    padding: 16,
    gap: 12,
  },
  analyticsSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  analyticsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: '800' as const,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  summaryPercent: {
    fontSize: 13,
    fontWeight: '700' as const,
    marginTop: 2,
  },
  barContainer: {
    paddingHorizontal: 2,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFillPositive: {
    height: 8,
    backgroundColor: '#10B981',
  },
  barFillNegative: {
    height: 8,
    backgroundColor: '#EF4444',
  },
  subcategoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  subcategoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subcategoryTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  subcategoryList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  reasonInfo: {
    flex: 1,
    marginRight: 12,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  reasonCountContainer: {
    alignItems: 'flex-end',
    minWidth: 70,
    gap: 4,
  },
  reasonCount: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  reasonBar: {
    height: 4,
    borderRadius: 2,
    width: 60,
    overflow: 'hidden',
  },
  reasonBarFill: {
    height: 4,
    borderRadius: 2,
  },
  emptySubText: {
    fontSize: 13,
    fontStyle: 'italic' as const,
    paddingVertical: 8,
  },
});
