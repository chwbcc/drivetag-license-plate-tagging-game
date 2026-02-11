import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Stack, router } from 'expo-router';
import { Activity, MapPin, Clock, Users, TrendingUp, ChevronDown, ChevronUp, Zap, Globe, BarChart3, Target, Gamepad2, Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { hashLicensePlate } from '@/utils/hash';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface GeoCluster {
  region: string;
  lat: number;
  lng: number;
  count: number;
  positive: number;
  negative: number;
}

interface HourBucket {
  hour: number;
  count: number;
}

interface DayBucket {
  day: string;
  date: string;
  count: number;
}

interface TopUser {
  id: string;
  displayName: string;
  pelletCount: number;
  lastActive: string;
}

function getRegionFromCoords(lat: number, lng: number): string {
  if (lat >= 37 && lat <= 42 && lng >= -80 && lng <= -71) return 'Northeast US';
  if (lat >= 25 && lat <= 35 && lng >= -90 && lng <= -75) return 'Southeast US';
  if (lat >= 37 && lat <= 49 && lng >= -95 && lng <= -80) return 'Midwest US';
  if (lat >= 25 && lat <= 37 && lng >= -107 && lng <= -90) return 'South Central US';
  if (lat >= 37 && lat <= 49 && lng >= -125 && lng <= -104) return 'Northwest US';
  if (lat >= 32 && lat <= 42 && lng >= -124 && lng <= -114) return 'California';
  if (lat >= 25 && lat <= 37 && lng >= -125 && lng <= -107) return 'Southwest US';
  if (lat >= 49 && lng >= -141 && lng <= -50) return 'Canada';
  if (lat >= 14 && lat <= 33 && lng >= -118 && lng <= -86) return 'Mexico';
  if (lat >= 35 && lat <= 71 && lng >= -10 && lng <= 40) return 'Europe';
  if (lat >= -56 && lat <= 13 && lng >= -82 && lng <= -34) return 'South America';
  if (lat >= -10 && lat <= 55 && lng >= 60 && lng <= 150) return 'Asia';
  if (lat >= -47 && lat <= -10 && lng >= 112 && lng <= 179) return 'Oceania';
  if (lat >= -35 && lat <= 37 && lng >= -18 && lng <= 52) return 'Africa';
  return 'Other';
}

function getDayName(dayIndex: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex] ?? '';
}

function formatHour(hour: number): string {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

export default function UserActivityScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | null>('geo');

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;

  if (!user?.adminRole || (user.adminRole !== 'admin' && user.adminRole !== 'super_admin')) {
    router.replace('/admin');
    return null;
  }

  const pelletsQuery = useQuery({
    queryKey: ['admin-activity-pellets'],
    queryFn: async () => {
      console.log('[Activity] Fetching pellets for activity analysis...');
      const { data, error } = await supabase
        .from('pellets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Activity] Pellets query error:', error);
        throw error;
      }
      console.log('[Activity] Fetched pellets:', data?.length || 0);
      return data || [];
    },
    enabled: !!user?.adminRole,
    refetchOnMount: true,
  });

  const usersQuery = useQuery({
    queryKey: ['admin-activity-users'],
    queryFn: async () => {
      console.log('[Activity] Fetching users for activity analysis...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Activity] Users query error:', error);
        throw error;
      }
      console.log('[Activity] Fetched users:', data?.length || 0);
      return data || [];
    },
    enabled: !!user?.adminRole,
    refetchOnMount: true,
  });

  const analytics = useMemo(() => {
    const pellets = pelletsQuery.data || [];
    const users = usersQuery.data || [];
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const pelletTimestamps = pellets.map((p: any) => new Date(p.created_at).getTime());

    const pelletsToday = pelletTimestamps.filter((t: number) => t >= oneDayAgo).length;
    const pelletsThisWeek = pelletTimestamps.filter((t: number) => t >= sevenDaysAgo).length;
    const pelletsThisMonth = pelletTimestamps.filter((t: number) => t >= thirtyDaysAgo).length;

    const activeUsersToday = new Set(
      pellets
        .filter((p: any) => new Date(p.created_at).getTime() >= oneDayAgo)
        .map((p: any) => p.created_by)
    ).size;

    const activeUsersWeek = new Set(
      pellets
        .filter((p: any) => new Date(p.created_at).getTime() >= sevenDaysAgo)
        .map((p: any) => p.created_by)
    ).size;

    const geoClusters: Record<string, GeoCluster> = {};
    let geoTaggedCount = 0;
    pellets.forEach((p: any) => {
      const loc = p.location;
      if (loc && typeof loc === 'object' && loc.latitude && loc.longitude) {
        geoTaggedCount++;
        const region = getRegionFromCoords(loc.latitude, loc.longitude);
        if (!geoClusters[region]) {
          geoClusters[region] = { region, lat: loc.latitude, lng: loc.longitude, count: 0, positive: 0, negative: 0 };
        }
        geoClusters[region].count++;
        if (p.type === 'positive') geoClusters[region].positive++;
        else geoClusters[region].negative++;
      }
    });
    const geoData = Object.values(geoClusters).sort((a, b) => b.count - a.count);

    const hourBuckets: HourBucket[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    pellets.forEach((p: any) => {
      const hour = new Date(p.created_at).getHours();
      hourBuckets[hour].count++;
    });
    const peakHour = hourBuckets.reduce((max, b) => b.count > max.count ? b : max, hourBuckets[0]);

    const dayBuckets: DayBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayKey = d.toISOString().split('T')[0];
      const count = pellets.filter((p: any) => {
        const pDate = new Date(p.created_at).toISOString().split('T')[0];
        return pDate === dayKey;
      }).length;
      dayBuckets.push({
        day: getDayName(d.getDay()),
        date: dayKey,
        count,
      });
    }

    const userPelletCounts: Record<string, { count: number; lastActive: string }> = {};
    pellets.forEach((p: any) => {
      const uid = p.created_by;
      if (!uid) return;
      if (!userPelletCounts[uid]) {
        userPelletCounts[uid] = { count: 0, lastActive: p.created_at };
      }
      userPelletCounts[uid].count++;
      if (new Date(p.created_at) > new Date(userPelletCounts[uid].lastActive)) {
        userPelletCounts[uid].lastActive = p.created_at;
      }
    });

    const topUsers: TopUser[] = Object.entries(userPelletCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([id, data]) => {
        const foundUser = users.find((u: any) => u.id === id);
        const displayName = foundUser
          ? hashLicensePlate(foundUser.license_plate || foundUser.username || foundUser.name || id)
          : hashLicensePlate(id);
        return {
          id,
          displayName,
          pelletCount: data.count,
          lastActive: data.lastActive,
        };
      });

    const newUsersToday = users.filter((u: any) => new Date(u.created_at).getTime() >= oneDayAgo).length;
    const newUsersWeek = users.filter((u: any) => new Date(u.created_at).getTime() >= sevenDaysAgo).length;
    const newUsersMonth = users.filter((u: any) => new Date(u.created_at).getTime() >= thirtyDaysAgo).length;

    return {
      totalUsers: users.length,
      totalPellets: pellets.length,
      pelletsToday,
      pelletsThisWeek,
      pelletsThisMonth,
      activeUsersToday,
      activeUsersWeek,
      geoData,
      geoTaggedCount,
      hourBuckets,
      peakHour,
      dayBuckets,
      topUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
    };
  }, [pelletsQuery.data, usersQuery.data]);

  const isLoading = pelletsQuery.isLoading || usersQuery.isLoading;

  const onRefresh = useCallback(() => {
    pelletsQuery.refetch();
    usersQuery.refetch();
  }, [pelletsQuery, usersQuery]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const maxHourCount = Math.max(...(analytics?.hourBuckets.map(b => b.count) || [1]), 1);
  const maxDayCount = Math.max(...(analytics?.dayBuckets.map(b => b.count) || [1]), 1);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'User Activity',
          headerBackTitle: 'Admin',
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: bgColor }]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={[styles.header, { backgroundColor: isDark ? '#1a2332' : '#EEF2FF' }]}>
          <View style={styles.headerRow}>
            <View style={[styles.headerIconBg, { backgroundColor: '#6366F120' }]}>
              <Activity size={22} color="#6366F1" />
            </View>
            <View style={styles.headerTextBlock}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Activity Monitor</Text>
              <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
                Real-time user engagement & geographic insights
              </Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={[styles.loadingText, { color: textSecondary }]}>Analyzing activity data...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.statIconBg, { backgroundColor: '#3B82F615' }]}>
                  <Users size={18} color="#3B82F6" />
                </View>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>{analytics?.totalUsers ?? 0}</Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Total Users</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.statIconBg, { backgroundColor: '#10B98115' }]}>
                  <Zap size={18} color="#10B981" />
                </View>
                <Text style={[styles.statValue, { color: '#10B981' }]}>{analytics?.activeUsersToday ?? 0}</Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Active Today</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.statIconBg, { backgroundColor: '#F59E0B15' }]}>
                  <Target size={18} color="#F59E0B" />
                </View>
                <Text style={[styles.statValue, { color: '#F59E0B' }]}>{analytics?.pelletsToday ?? 0}</Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Pellets Today</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
                <View style={[styles.statIconBg, { backgroundColor: '#8B5CF615' }]}>
                  <TrendingUp size={18} color="#8B5CF6" />
                </View>
                <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{analytics?.activeUsersWeek ?? 0}</Text>
                <Text style={[styles.statLabel, { color: textSecondary }]}>Active 7d</Text>
              </View>
            </View>

            <View style={[styles.summaryStrip, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: textColor }]}>{analytics?.pelletsThisWeek ?? 0}</Text>
                <Text style={[styles.summaryLabel, { color: textSecondary }]}>Pellets 7d</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: textColor }]}>{analytics?.pelletsThisMonth ?? 0}</Text>
                <Text style={[styles.summaryLabel, { color: textSecondary }]}>Pellets 30d</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: textColor }]}>{analytics?.newUsersWeek ?? 0}</Text>
                <Text style={[styles.summaryLabel, { color: textSecondary }]}>New Users 7d</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: borderColor }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: textColor }]}>{analytics?.newUsersMonth ?? 0}</Text>
                <Text style={[styles.summaryLabel, { color: textSecondary }]}>New Users 30d</Text>
              </View>
            </View>

            {/* Geographic Pellet Distribution */}
            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('geo')} activeOpacity={0.7}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#EF444415' }]}>
                    <Globe size={18} color="#EF4444" />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Geographic Distribution</Text>
                    <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                      {analytics?.geoTaggedCount ?? 0} of {analytics?.totalPellets ?? 0} pellets have location data
                    </Text>
                  </View>
                </View>
                {expandedSection === 'geo' ? <ChevronUp size={20} color={textSecondary} /> : <ChevronDown size={20} color={textSecondary} />}
              </TouchableOpacity>
              {expandedSection === 'geo' && (
                <View style={styles.sectionContent}>
                  {analytics?.geoData && analytics.geoData.length > 0 ? (
                    analytics.geoData.map((cluster, idx) => {
                      const maxCount = analytics.geoData[0]?.count || 1;
                      const barWidth = Math.max(8, (cluster.count / maxCount) * 100);
                      return (
                        <View key={cluster.region} style={[styles.geoRow, idx < analytics.geoData.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                          <View style={styles.geoInfo}>
                            <View style={styles.geoNameRow}>
                              <MapPin size={14} color="#EF4444" />
                              <Text style={[styles.geoName, { color: textColor }]}>{cluster.region}</Text>
                            </View>
                            <View style={styles.geoMeta}>
                              <Text style={[styles.geoMetaText, { color: '#10B981' }]}>+{cluster.positive}</Text>
                              <Text style={[styles.geoMetaText, { color: '#EF4444' }]}>-{cluster.negative}</Text>
                            </View>
                          </View>
                          <View style={styles.geoBarArea}>
                            <Text style={[styles.geoCount, { color: textColor }]}>{cluster.count}</Text>
                            <View style={[styles.geoBarTrack, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                              <View style={[styles.geoBarFill, { width: `${barWidth}%` }]} />
                            </View>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptySection}>
                      <MapPin size={32} color={textSecondary} />
                      <Text style={[styles.emptySectionText, { color: textSecondary }]}>
                        No geo-tagged pellets yet. Location data will appear as users log pellets with GPS enabled.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Peak Usage Hours */}
            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('hours')} activeOpacity={0.7}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#F59E0B15' }]}>
                    <Clock size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Peak Usage Hours</Text>
                    <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                      Peak: {analytics?.peakHour ? formatHour(analytics.peakHour.hour) : 'N/A'} ({analytics?.peakHour?.count ?? 0} pellets)
                    </Text>
                  </View>
                </View>
                {expandedSection === 'hours' ? <ChevronUp size={20} color={textSecondary} /> : <ChevronDown size={20} color={textSecondary} />}
              </TouchableOpacity>
              {expandedSection === 'hours' && (
                <View style={styles.sectionContent}>
                  <View style={styles.hourChart}>
                    {analytics?.hourBuckets.map((bucket) => {
                      const height = maxHourCount > 0 ? Math.max(4, (bucket.count / maxHourCount) * 80) : 4;
                      const isPeak = bucket.hour === analytics.peakHour?.hour;
                      return (
                        <View key={bucket.hour} style={styles.hourBarWrapper}>
                          <Text style={[styles.hourBarCount, { color: isPeak ? '#F59E0B' : textSecondary }]}>
                            {bucket.count > 0 ? bucket.count : ''}
                          </Text>
                          <View
                            style={[
                              styles.hourBar,
                              {
                                height,
                                backgroundColor: isPeak ? '#F59E0B' : isDark ? '#4B5563' : '#CBD5E1',
                              },
                            ]}
                          />
                          {bucket.hour % 3 === 0 && (
                            <Text style={[styles.hourLabel, { color: textSecondary }]}>{formatHour(bucket.hour)}</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* 7-Day Activity Trend */}
            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('trend')} activeOpacity={0.7}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#6366F115' }]}>
                    <BarChart3 size={18} color="#6366F1" />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>7-Day Trend</Text>
                    <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                      Daily pellet submission activity
                    </Text>
                  </View>
                </View>
                {expandedSection === 'trend' ? <ChevronUp size={20} color={textSecondary} /> : <ChevronDown size={20} color={textSecondary} />}
              </TouchableOpacity>
              {expandedSection === 'trend' && (
                <View style={styles.sectionContent}>
                  <View style={styles.dayChart}>
                    {analytics?.dayBuckets.map((bucket) => {
                      const height = maxDayCount > 0 ? Math.max(6, (bucket.count / maxDayCount) * 100) : 6;
                      return (
                        <View key={bucket.date} style={styles.dayBarWrapper}>
                          <Text style={[styles.dayBarCount, { color: '#6366F1' }]}>
                            {bucket.count > 0 ? bucket.count : ''}
                          </Text>
                          <View
                            style={[
                              styles.dayBar,
                              {
                                height,
                                backgroundColor: '#6366F1',
                              },
                            ]}
                          />
                          <Text style={[styles.dayLabel, { color: textSecondary }]}>{bucket.day}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Top Active Users */}
            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('topUsers')} activeOpacity={0.7}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#10B98115' }]}>
                    <Users size={18} color="#10B981" />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>Top Active Users</Text>
                    <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                      Most pellets submitted (encrypted)
                    </Text>
                  </View>
                </View>
                {expandedSection === 'topUsers' ? <ChevronUp size={20} color={textSecondary} /> : <ChevronDown size={20} color={textSecondary} />}
              </TouchableOpacity>
              {expandedSection === 'topUsers' && (
                <View style={styles.sectionContent}>
                  {analytics?.topUsers && analytics.topUsers.length > 0 ? (
                    analytics.topUsers.map((tu, idx) => {
                      const maxPellets = analytics.topUsers[0]?.pelletCount || 1;
                      const barWidth = Math.max(8, (tu.pelletCount / maxPellets) * 100);
                      const rankColors = ['#F59E0B', '#94A3B8', '#CD7F32', '#6366F1', '#6366F1'];
                      const rankColor = idx < 3 ? rankColors[idx] : '#6366F1';
                      return (
                        <View key={tu.id} style={[styles.topUserRow, idx < analytics.topUsers.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                          <View style={[styles.rankBadge, { backgroundColor: rankColor + '20' }]}>
                            <Text style={[styles.rankText, { color: rankColor }]}>#{idx + 1}</Text>
                          </View>
                          <View style={styles.topUserInfo}>
                            <Text style={[styles.topUserName, { color: textColor }]}>{tu.displayName}</Text>
                            <Text style={[styles.topUserMeta, { color: textSecondary }]}>
                              Last active: {formatDate(tu.lastActive)}
                            </Text>
                            <View style={[styles.topUserBarTrack, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
                              <View style={[styles.topUserBarFill, { width: `${barWidth}%`, backgroundColor: rankColor }]} />
                            </View>
                          </View>
                          <Text style={[styles.topUserCount, { color: rankColor }]}>{tu.pelletCount}</Text>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.emptySection}>
                      <Users size={32} color={textSecondary} />
                      <Text style={[styles.emptySectionText, { color: textSecondary }]}>No user activity data yet</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* New User Signups */}
            <View style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('signups')} activeOpacity={0.7}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#8B5CF615' }]}>
                    <Calendar size={18} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>User Growth</Text>
                    <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
                      New signups over time
                    </Text>
                  </View>
                </View>
                {expandedSection === 'signups' ? <ChevronUp size={20} color={textSecondary} /> : <ChevronDown size={20} color={textSecondary} />}
              </TouchableOpacity>
              {expandedSection === 'signups' && (
                <View style={styles.sectionContent}>
                  <View style={styles.growthGrid}>
                    <View style={[styles.growthCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                      <Text style={[styles.growthValue, { color: '#8B5CF6' }]}>{analytics?.newUsersToday ?? 0}</Text>
                      <Text style={[styles.growthLabel, { color: textSecondary }]}>Today</Text>
                    </View>
                    <View style={[styles.growthCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                      <Text style={[styles.growthValue, { color: '#8B5CF6' }]}>{analytics?.newUsersWeek ?? 0}</Text>
                      <Text style={[styles.growthLabel, { color: textSecondary }]}>This Week</Text>
                    </View>
                    <View style={[styles.growthCard, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                      <Text style={[styles.growthValue, { color: '#8B5CF6' }]}>{analytics?.newUsersMonth ?? 0}</Text>
                      <Text style={[styles.growthLabel, { color: textSecondary }]}>This Month</Text>
                    </View>
                  </View>
                </View>
              )}
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
  header: {
    padding: 20,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  statCard: {
    width: (SCREEN_WIDTH - 34) / 2 - 5,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800' as const,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  summaryStrip: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 4,
  },
  sectionCard: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  geoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  geoInfo: {
    flex: 1,
    marginRight: 12,
  },
  geoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  geoName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  geoMeta: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 20,
  },
  geoMetaText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  geoBarArea: {
    alignItems: 'flex-end',
    minWidth: 80,
    gap: 4,
  },
  geoCount: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  geoBarTrack: {
    height: 5,
    borderRadius: 3,
    width: 80,
    overflow: 'hidden',
  },
  geoBarFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  hourChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: 20,
  },
  hourBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  hourBarCount: {
    fontSize: 8,
    fontWeight: '600' as const,
    marginBottom: 2,
    minHeight: 10,
  },
  hourBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 4,
  },
  hourLabel: {
    fontSize: 8,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  dayChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 140,
    paddingTop: 20,
  },
  dayBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  dayBarCount: {
    fontSize: 12,
    fontWeight: '700' as const,
    marginBottom: 4,
    minHeight: 16,
  },
  dayBar: {
    width: 28,
    borderRadius: 6,
    minHeight: 6,
  },
  dayLabel: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600' as const,
  },
  topUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rankBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '800' as const,
  },
  topUserInfo: {
    flex: 1,
  },
  topUserName: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  topUserMeta: {
    fontSize: 10,
    marginBottom: 6,
  },
  topUserBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  topUserBarFill: {
    height: 4,
    borderRadius: 2,
  },
  topUserCount: {
    fontSize: 18,
    fontWeight: '800' as const,
    minWidth: 30,
    textAlign: 'right' as const,
  },
  growthGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  growthCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  growthValue: {
    fontSize: 24,
    fontWeight: '800' as const,
  },
  growthLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  emptySection: {
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  emptySectionText: {
    fontSize: 13,
    textAlign: 'center' as const,
    lineHeight: 18,
  },
});
