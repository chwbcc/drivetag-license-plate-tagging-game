import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { BarChart3, Users, Target, TrendingUp, ThumbsUp, ThumbsDown, Clock, AlertCircle, ArrowLeft, Activity, Award, Zap, Calendar, MapPin } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  role: string | null;
  experience: number | null;
  level: number | null;
  negative_pellet_count: number | null;
  positive_pellet_count: number | null;
  badges: string | string[] | null;
  created_at: string;
  state: string | null;
}

interface PelletRow {
  id: string;
  type: string;
  reason: string | null;
  createdby: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AnalyticsScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();

  const bgColor = isDark ? '#0f1117' : '#f0f2f5';
  const cardColor = isDark ? '#1a1d28' : '#ffffff';
  const textColor = isDark ? '#e8eaf0' : '#1a1d28';
  const textSecondary = isDark ? '#6b7189' : '#6b7280';
  const borderColor = isDark ? '#2a2d3a' : '#e2e5eb';
  const accentBlue = '#2563EB';
  const accentTeal = '#0d9488';
  const accentAmber = '#d97706';
  const accentRose = '#e11d48';
  const accentViolet = '#7c3aed';

  const hasAccess = user?.adminRole === 'analyst' || user?.adminRole === 'moderator' || user?.adminRole === 'admin' || user?.adminRole === 'super_admin';

  const usersQuery = useQuery({
    queryKey: ['analytics-users'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('users')
        .select('id, email, name, username, role, experience, level, negative_pellet_count, positive_pellet_count, badges, created_at, state', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { users: (data || []) as UserRow[], count: count || 0 };
    },
    enabled: hasAccess,
    refetchOnMount: true,
  });

  const pelletsQuery = useQuery({
    queryKey: ['analytics-pellets'],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('pellets')
        .select('id, type, reason, createdby, created_at, latitude, longitude', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { pellets: (data || []) as PelletRow[], count: count || 0 };
    },
    enabled: hasAccess,
    refetchOnMount: true,
  });

  const metrics = useMemo(() => {
    const users = usersQuery.data?.users || [];
    const pellets = pelletsQuery.data?.pellets || [];
    const now = Date.now();
    const oneDayMs = 86400000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    const totalUsers = users.length;
    const newUsersToday = users.filter(u => now - new Date(u.created_at).getTime() < oneDayMs).length;
    const newUsers7d = users.filter(u => now - new Date(u.created_at).getTime() < sevenDaysMs).length;
    const newUsers30d = users.filter(u => now - new Date(u.created_at).getTime() < thirtyDaysMs).length;

    const totalPellets = pellets.length;
    const positivePellets = pellets.filter(p => p.type === 'positive').length;
    const negativePellets = pellets.filter(p => p.type === 'negative').length;
    const pelletsToday = pellets.filter(p => now - new Date(p.created_at).getTime() < oneDayMs).length;
    const pellets7d = pellets.filter(p => now - new Date(p.created_at).getTime() < sevenDaysMs).length;

    const roleDistribution: Record<string, number> = {};
    users.forEach(u => {
      const role = u.role || 'user';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });

    const levelDistribution: Record<number, number> = {};
    users.forEach(u => {
      const level = u.level || 1;
      levelDistribution[level] = (levelDistribution[level] || 0) + 1;
    });

    const stateDistribution: Record<string, number> = {};
    users.forEach(u => {
      if (u.state) {
        stateDistribution[u.state] = (stateDistribution[u.state] || 0) + 1;
      }
    });
    const topStates = Object.entries(stateDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const reasonDistribution: Record<string, number> = {};
    pellets.forEach(p => {
      const reason = p.reason || 'Unknown';
      reasonDistribution[reason] = (reasonDistribution[reason] || 0) + 1;
    });
    const topReasons = Object.entries(reasonDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const pelletCreatorCounts: Record<string, number> = {};
    pellets.forEach(p => {
      pelletCreatorCounts[p.createdby] = (pelletCreatorCounts[p.createdby] || 0) + 1;
    });
    const topCreators = Object.entries(pelletCreatorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => {
        const u = users.find(usr => usr.id === userId);
        return { name: u?.name || u?.username || u?.email || 'Unknown', count };
      });

    const avgExp = totalUsers > 0 ? Math.round(users.reduce((sum, u) => sum + (u.experience || 0), 0) / totalUsers) : 0;
    const avgLevel = totalUsers > 0 ? (users.reduce((sum, u) => sum + (u.level || 1), 0) / totalUsers).toFixed(1) : '0';

    const totalBadges = users.reduce((sum, u) => {
      const badges = typeof u.badges === 'string' ? JSON.parse(u.badges || '[]') : (u.badges || []);
      return sum + badges.length;
    }, 0);
    const avgBadges = totalUsers > 0 ? (totalBadges / totalUsers).toFixed(1) : '0';

    const positiveRatio = totalPellets > 0 ? Math.round((positivePellets / totalPellets) * 100) : 0;

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayDistribution = new Array(7).fill(0);
    pellets.forEach(p => {
      const day = new Date(p.created_at).getDay();
      dayDistribution[day]++;
    });

    const hourDistribution = new Array(24).fill(0);
    pellets.forEach(p => {
      const hour = new Date(p.created_at).getHours();
      hourDistribution[hour]++;
    });

    const geoCount = pellets.filter(p => p.latitude && p.longitude).length;

    return {
      totalUsers, newUsersToday, newUsers7d, newUsers30d,
      totalPellets, positivePellets, negativePellets, pelletsToday, pellets7d,
      roleDistribution, levelDistribution, topStates,
      topReasons, topCreators,
      avgExp, avgLevel, avgBadges, positiveRatio,
      dayLabels, dayDistribution, hourDistribution, geoCount, totalBadges,
    };
  }, [usersQuery.data, pelletsQuery.data]);

  const isLoading = usersQuery.isLoading || pelletsQuery.isLoading;
  const isRefetching = usersQuery.isRefetching || pelletsQuery.isRefetching;

  const handleRefresh = () => {
    usersQuery.refetch();
    pelletsQuery.refetch();
  };

  if (!hasAccess) {
    return (
      <>
        <Stack.Screen options={{ title: 'Access Denied', headerBackTitle: 'Back' }} />
        <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
          <AlertCircle size={64} color={Colors.error} />
          <Text style={[styles.accessDeniedTitle, { color: textColor }]}>Access Denied</Text>
          <Text style={[styles.accessDeniedText, { color: textSecondary }]}>
            You need Analyst, Moderator, or Admin access to view analytics.
          </Text>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: accentBlue }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const maxDay = Math.max(...metrics.dayDistribution, 1);
  const maxHour = Math.max(...metrics.hourDistribution, 1);

  const renderBarChart = (data: number[], labels: string[], maxVal: number, color: string) => {
    const barWidth = Math.min(28, (SCREEN_WIDTH - 80) / data.length - 4);
    return (
      <View style={styles.barChartContainer}>
        <View style={styles.barChartBars}>
          {data.map((val, i) => (
            <View key={i} style={styles.barChartItem}>
              <Text style={[styles.barValue, { color: textSecondary }]}>
                {val > 0 ? val : ''}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: borderColor }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: color,
                      height: `${Math.max(4, (val / maxVal) * 100)}%`,
                      width: barWidth,
                      borderRadius: barWidth / 2,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: textSecondary }]}>{labels[i]}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Analytics',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: bgColor },
          headerTintColor: textColor,
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: bgColor }]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={accentBlue} />
        }
      >
        <View style={[styles.headerBanner, { backgroundColor: accentBlue }]}>
          <View style={styles.headerBannerInner}>
            <View style={styles.headerBannerIcon}>
              <BarChart3 size={28} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerBannerTitle}>Analytics Dashboard</Text>
              <Text style={styles.headerBannerSub}>
                User data & engagement metrics
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accentBlue} />
            <Text style={[styles.loadingText, { color: textSecondary }]}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.kpiIcon, { backgroundColor: accentBlue + '15' }]}>
                  <Users size={18} color={accentBlue} />
                </View>
                <Text style={[styles.kpiValue, { color: textColor }]}>{metrics.totalUsers}</Text>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Total Users</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.kpiIcon, { backgroundColor: accentTeal + '15' }]}>
                  <Target size={18} color={accentTeal} />
                </View>
                <Text style={[styles.kpiValue, { color: textColor }]}>{metrics.totalPellets}</Text>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Total Pellets</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.kpiIcon, { backgroundColor: accentAmber + '15' }]}>
                  <TrendingUp size={18} color={accentAmber} />
                </View>
                <Text style={[styles.kpiValue, { color: textColor }]}>{metrics.positiveRatio}%</Text>
                <Text style={[styles.kpiLabel, { color: textSecondary }]}>Positive Rate</Text>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentBlue + '12' }]}>
                  <Users size={16} color={accentBlue} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>User Growth</Text>
              </View>
              <View style={styles.metricGrid}>
                <View style={[styles.metricCell, { borderColor }]}>
                  <Text style={[styles.metricCellValue, { color: accentBlue }]}>{metrics.newUsersToday}</Text>
                  <Text style={[styles.metricCellLabel, { color: textSecondary }]}>Today</Text>
                </View>
                <View style={[styles.metricCell, { borderColor }]}>
                  <Text style={[styles.metricCellValue, { color: accentTeal }]}>{metrics.newUsers7d}</Text>
                  <Text style={[styles.metricCellLabel, { color: textSecondary }]}>7 Days</Text>
                </View>
                <View style={[styles.metricCell, { borderColor }]}>
                  <Text style={[styles.metricCellValue, { color: accentAmber }]}>{metrics.newUsers30d}</Text>
                  <Text style={[styles.metricCellLabel, { color: textSecondary }]}>30 Days</Text>
                </View>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentTeal + '12' }]}>
                  <Target size={16} color={accentTeal} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Pellet Overview</Text>
              </View>
              <View style={styles.pelletSplitRow}>
                <View style={[styles.pelletSplitCard, { backgroundColor: '#10B981' + '10', borderColor: '#10B981' + '30' }]}>
                  <ThumbsUp size={20} color="#10B981" />
                  <Text style={[styles.pelletSplitValue, { color: '#10B981' }]}>{metrics.positivePellets}</Text>
                  <Text style={[styles.pelletSplitLabel, { color: textSecondary }]}>Positive</Text>
                </View>
                <View style={[styles.pelletSplitCard, { backgroundColor: accentRose + '10', borderColor: accentRose + '30' }]}>
                  <ThumbsDown size={20} color={accentRose} />
                  <Text style={[styles.pelletSplitValue, { color: accentRose }]}>{metrics.negativePellets}</Text>
                  <Text style={[styles.pelletSplitLabel, { color: textSecondary }]}>Negative</Text>
                </View>
              </View>
              <View style={styles.metricGrid}>
                <View style={[styles.metricCell, { borderColor }]}>
                  <Text style={[styles.metricCellValue, { color: accentBlue }]}>{metrics.pelletsToday}</Text>
                  <Text style={[styles.metricCellLabel, { color: textSecondary }]}>Today</Text>
                </View>
                <View style={[styles.metricCell, { borderColor }]}>
                  <Text style={[styles.metricCellValue, { color: accentTeal }]}>{metrics.pellets7d}</Text>
                  <Text style={[styles.metricCellLabel, { color: textSecondary }]}>7 Days</Text>
                </View>
                <View style={[styles.metricCell, { borderColor }]}>
                  <Text style={[styles.metricCellValue, { color: accentViolet }]}>{metrics.geoCount}</Text>
                  <Text style={[styles.metricCellLabel, { color: textSecondary }]}>With Location</Text>
                </View>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentViolet + '12' }]}>
                  <Calendar size={16} color={accentViolet} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Pellets by Day of Week</Text>
              </View>
              {renderBarChart(metrics.dayDistribution, metrics.dayLabels, maxDay, accentBlue)}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentAmber + '12' }]}>
                  <Clock size={16} color={accentAmber} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Pellets by Hour</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {renderBarChart(
                  metrics.hourDistribution,
                  Array.from({ length: 24 }, (_, i) => `${i}`),
                  maxHour,
                  accentTeal,
                )}
              </ScrollView>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentBlue + '12' }]}>
                  <Zap size={16} color={accentBlue} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>User Averages</Text>
              </View>
              <View style={styles.avgRow}>
                <View style={[styles.avgCard, { backgroundColor: bgColor, borderColor }]}>
                  <Text style={[styles.avgValue, { color: accentBlue }]}>{metrics.avgExp}</Text>
                  <Text style={[styles.avgLabel, { color: textSecondary }]}>Avg EXP</Text>
                </View>
                <View style={[styles.avgCard, { backgroundColor: bgColor, borderColor }]}>
                  <Text style={[styles.avgValue, { color: accentAmber }]}>{metrics.avgLevel}</Text>
                  <Text style={[styles.avgLabel, { color: textSecondary }]}>Avg Level</Text>
                </View>
                <View style={[styles.avgCard, { backgroundColor: bgColor, borderColor }]}>
                  <Text style={[styles.avgValue, { color: accentViolet }]}>{metrics.avgBadges}</Text>
                  <Text style={[styles.avgLabel, { color: textSecondary }]}>Avg Badges</Text>
                </View>
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentRose + '12' }]}>
                  <Activity size={16} color={accentRose} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Top Pellet Reasons</Text>
              </View>
              {metrics.topReasons.length === 0 ? (
                <Text style={[styles.emptyText, { color: textSecondary }]}>No pellet data yet</Text>
              ) : (
                metrics.topReasons.map(([reason, count], i) => {
                  const maxCount = metrics.topReasons[0][1] as number;
                  const pct = Math.round(((count as number) / maxCount) * 100);
                  return (
                    <View key={reason} style={styles.rankRow}>
                      <View style={[styles.rankNum, { backgroundColor: accentRose + '12' }]}>
                        <Text style={[styles.rankNumText, { color: accentRose }]}>{i + 1}</Text>
                      </View>
                      <View style={styles.rankContent}>
                        <View style={styles.rankTextRow}>
                          <Text style={[styles.rankName, { color: textColor }]} numberOfLines={1}>{reason}</Text>
                          <Text style={[styles.rankCount, { color: textSecondary }]}>{count}</Text>
                        </View>
                        <View style={[styles.rankBarTrack, { backgroundColor: borderColor }]}>
                          <View style={[styles.rankBarFill, { width: `${pct}%`, backgroundColor: accentRose }]} />
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentAmber + '12' }]}>
                  <Award size={16} color={accentAmber} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Most Active Users</Text>
              </View>
              {metrics.topCreators.length === 0 ? (
                <Text style={[styles.emptyText, { color: textSecondary }]}>No activity data yet</Text>
              ) : (
                metrics.topCreators.map((creator, i) => {
                  const maxCount = metrics.topCreators[0].count;
                  const pct = Math.round((creator.count / maxCount) * 100);
                  return (
                    <View key={i} style={styles.rankRow}>
                      <View style={[styles.rankNum, { backgroundColor: accentAmber + '12' }]}>
                        <Text style={[styles.rankNumText, { color: accentAmber }]}>{i + 1}</Text>
                      </View>
                      <View style={styles.rankContent}>
                        <View style={styles.rankTextRow}>
                          <Text style={[styles.rankName, { color: textColor }]} numberOfLines={1}>{creator.name}</Text>
                          <Text style={[styles.rankCount, { color: textSecondary }]}>{creator.count} pellets</Text>
                        </View>
                        <View style={[styles.rankBarTrack, { backgroundColor: borderColor }]}>
                          <View style={[styles.rankBarFill, { width: `${pct}%`, backgroundColor: accentAmber }]} />
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentTeal + '12' }]}>
                  <MapPin size={16} color={accentTeal} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Users by State</Text>
              </View>
              {metrics.topStates.length === 0 ? (
                <Text style={[styles.emptyText, { color: textSecondary }]}>No state data yet</Text>
              ) : (
                <View style={styles.stateGrid}>
                  {metrics.topStates.map(([state, count]) => (
                    <View key={state} style={[styles.stateChip, { backgroundColor: accentTeal + '10', borderColor: accentTeal + '25' }]}>
                      <Text style={[styles.stateChipLabel, { color: accentTeal }]}>{state}</Text>
                      <Text style={[styles.stateChipCount, { color: textColor }]}>{count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentViolet + '12' }]}>
                  <Users size={16} color={accentViolet} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Role Distribution</Text>
              </View>
              <View style={styles.roleGrid}>
                {Object.entries(metrics.roleDistribution).sort((a, b) => b[1] - a[1]).map(([role, count]) => {
                  const roleColor = role === 'super_admin' ? '#FFD700' : role === 'admin' ? '#FF6B6B' : role === 'moderator' ? '#4ECDC4' : role === 'analyst' ? accentBlue : textSecondary;
                  return (
                    <View key={role} style={[styles.roleChip, { backgroundColor: roleColor + '12', borderColor: roleColor + '30' }]}>
                      <View style={[styles.roleDot, { backgroundColor: roleColor }]} />
                      <Text style={[styles.roleChipLabel, { color: roleColor }]}>
                        {role === 'super_admin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                      <Text style={[styles.roleChipCount, { color: textColor }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: accentBlue + '12' }]}>
                  <TrendingUp size={16} color={accentBlue} />
                </View>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Level Distribution</Text>
              </View>
              <View style={styles.levelGrid}>
                {Object.entries(metrics.levelDistribution)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([level, count]) => (
                    <View key={level} style={[styles.levelChip, { backgroundColor: bgColor, borderColor }]}>
                      <Text style={[styles.levelChipLevel, { color: accentBlue }]}>Lv.{level}</Text>
                      <Text style={[styles.levelChipCount, { color: textColor }]}>{count}</Text>
                    </View>
                  ))}
              </View>
            </View>

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 18,
  },
  headerBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBannerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 2,
  },
  headerBannerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 14,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  sectionCard: {
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconBg: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  metricCellValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  metricCellLabel: {
    fontSize: 11,
  },
  pelletSplitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pelletSplitCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  pelletSplitValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  pelletSplitLabel: {
    fontSize: 12,
  },
  barChartContainer: {
    paddingTop: 4,
  },
  barChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
  },
  barChartItem: {
    alignItems: 'center',
    flex: 1,
  },
  barValue: {
    fontSize: 9,
    marginBottom: 4,
    height: 14,
  },
  barTrack: {
    width: '100%',
    height: 80,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    minHeight: 4,
  },
  barLabel: {
    fontSize: 9,
    marginTop: 4,
  },
  avgRow: {
    flexDirection: 'row',
    gap: 8,
  },
  avgCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  avgValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  avgLabel: {
    fontSize: 11,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  rankNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  rankContent: {
    flex: 1,
  },
  rankTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankName: {
    fontSize: 13,
    fontWeight: '600' as const,
    flex: 1,
    marginRight: 8,
  },
  rankCount: {
    fontSize: 12,
  },
  rankBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  rankBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  stateChipLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  stateChipCount: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleChipLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  roleChipCount: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelChip: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 60,
  },
  levelChipLevel: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  levelChipCount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center' as const,
    paddingVertical: 12,
  },
  accessDeniedTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 14,
    textAlign: 'center' as const,
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
