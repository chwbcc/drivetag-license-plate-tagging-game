import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Trophy, ArrowUp, ArrowDown, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, BarChart, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import usePelletStore from '@/store/pellet-store';
import useAuthStore from '@/store/auth-store';
import { hashLicensePlate, calculateStatistics } from '@/utils/hash';
import { useTheme } from '@/store/theme-store';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';

type LeaderboardItem = {
  licensePlate: string;
  hashedId: string;
  count: number;
};

type ExpLeaderboardItem = {
  id: string;
  name: string;
  exp: number;
  level: number;
};

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const { pellets } = usePelletStore();
  const { getAllUsers } = useAuthStore();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pelletType, setPelletType] = useState<'negative' | 'positive' | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'pellets' | 'experience'>('pellets');
  const [useDatabase, setUseDatabase] = useState(true);
  
  const pelletLeaderboardQuery = useQuery({
    queryKey: ['leaderboard', 'pellets', sortOrder, pelletType],
    queryFn: async () => {
      let query = supabase
        .from('pellets')
        .select('license_plate, type');
      
      if (pelletType !== 'all') {
        query = query.eq('type', pelletType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const plateMap = new Map<string, number>();
      (data || []).forEach((item: any) => {
        const plate = item.license_plate;
        if (plate) {
          plateMap.set(plate, (plateMap.get(plate) || 0) + 1);
        }
      });
      
      const aggregated = Array.from(plateMap.entries()).map(([licensePlate, count]) => ({
        licensePlate,
        count,
      }));
      
      aggregated.sort((a, b) => {
        return sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
      });
      
      return { data: aggregated };
    },
    enabled: useDatabase && activeTab === 'pellets',
  });
  
  const expLeaderboardQuery = useQuery({
    queryKey: ['leaderboard', 'experience', sortOrder],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, experience, level')
        .limit(100);
      
      if (error) throw error;
      
      const parsedData = (data || []).map((row: any) => {
        return {
          id: row.id,
          name: row.name || 'Anonymous',
          exp: row.experience || 0,
          level: row.level || 1,
        };
      }).sort((a, b) => {
        return sortOrder === 'asc' ? a.exp - b.exp : b.exp - a.exp;
      });
      
      return { data: parsedData };
    },
    enabled: useDatabase && activeTab === 'experience',
  });
  
  const styles = getStyles(theme);
  const iconColor = theme === 'dark' ? '#9CA3AF' : Colors.textSecondary;
  const textColor = theme === 'dark' ? '#F9FAFB' : Colors.text;
  
  // Fallback to local data if database fetch fails
  useEffect(() => {
    if (pelletLeaderboardQuery.isError || expLeaderboardQuery.isError) {
      console.log('[Leaderboard] Database fetch failed, using local data');
      setUseDatabase(false);
    }
  }, [pelletLeaderboardQuery.isError, expLeaderboardQuery.isError]);
  
  const filteredPellets = pelletType === 'all' 
    ? pellets 
    : pellets.filter(pellet => pellet.type === pelletType);
  
  const leaderboardData: LeaderboardItem[] = React.useMemo(() => {
    if (useDatabase && pelletLeaderboardQuery.data?.data) {
      return pelletLeaderboardQuery.data.data.map((item: any) => ({
        licensePlate: item.licensePlate || item.license_plate,
        hashedId: hashLicensePlate(item.licensePlate || item.license_plate),
        count: item.count,
      }));
    }
    
    // Fallback to local data
    const plateMap = new Map<string, number>();
    
    filteredPellets.forEach(pellet => {
      const plate = pellet.targetLicensePlate;
      plateMap.set(plate, (plateMap.get(plate) || 0) + 1);
    });
    
    return Array.from(plateMap.entries()).map(([licensePlate, count]) => ({
      licensePlate,
      hashedId: hashLicensePlate(licensePlate),
      count,
    }));
  }, [filteredPellets, useDatabase, pelletLeaderboardQuery.data]);
  
  const expLeaderboardData: ExpLeaderboardItem[] = React.useMemo(() => {
    if (useDatabase && expLeaderboardQuery.data?.data) {
      return expLeaderboardQuery.data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        exp: item.exp,
        level: item.level,
      }));
    }
    
    // Fallback to local data
    const users = getAllUsers();
    return users.map(user => ({
      id: user.id,
      name: user.name || user.email.split('@')[0],
      exp: user.exp || 0,
      level: user.level || 1
    }));
  }, [getAllUsers, useDatabase, expLeaderboardQuery.data]);
  
  const sortedPelletData = useDatabase && pelletLeaderboardQuery.data?.data 
    ? leaderboardData 
    : [...leaderboardData].sort((a, b) => {
        return sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
      });
  
  const sortedExpData = useDatabase && expLeaderboardQuery.data?.data
    ? expLeaderboardData
    : [...expLeaderboardData].sort((a, b) => {
        return sortOrder === 'desc' ? b.exp - a.exp : a.exp - b.exp;
      });
  
  const statistics = calculateStatistics(pellets);
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };
  
  const renderPelletItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={[
          styles.rankContainer,
          pelletType === 'positive' && styles.positiveRankContainer
        ]}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.licensePlate}>{item.hashedId}</Text>
        </View>
        
        <View style={styles.countContainer}>
          <Text style={[
            styles.countText,
            pelletType === 'positive' && styles.positiveCountText
          ]}>{item.count}</Text>
          <Text style={styles.countLabel}>pellets</Text>
        </View>
      </View>
    );
  };
  
  const renderExpItem = ({ item, index }: { item: ExpLeaderboardItem; index: number }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.expRankContainer}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.licensePlate}>{item.name}</Text>
          <Text style={styles.levelText}>Level {item.level}</Text>
        </View>
        
        <View style={styles.countContainer}>
          <Text style={styles.expCountText}>{item.exp}</Text>
          <Text style={styles.countLabel}>EXP</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <TouchableOpacity onPress={toggleSortOrder} style={styles.sortButton}>
          {sortOrder === 'desc' ? (
            <ArrowDown size={20} color={textColor} />
          ) : (
            <ArrowUp size={20} color={textColor} />
          )}
        </TouchableOpacity>
      </View>
      
      {statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <BarChart size={20} color={textColor} />
            <Text style={styles.statsTitle}>Aggregate Statistics</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.positivePercentage}%</Text>
              <Text style={styles.statLabel}>Positive Tags</Text>
              <View style={styles.trendContainer}>
                {statistics.positiveChange > 0 ? (
                  <>
                    <TrendingUp size={14} color={Colors.success} />
                    <Text style={[styles.trendText, styles.positiveTrend]}>
                      {statistics.positiveChange}%
                    </Text>
                  </>
                ) : statistics.positiveChange < 0 ? (
                  <>
                    <TrendingDown size={14} color={Colors.error} />
                    <Text style={[styles.trendText, styles.negativeTrend]}>
                      {Math.abs(statistics.positiveChange)}%
                    </Text>
                  </>
                ) : (
                  <Text style={styles.trendText}>No change</Text>
                )}
              </View>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{statistics.negativePercentage}%</Text>
              <Text style={styles.statLabel}>Negative Tags</Text>
              <View style={styles.trendContainer}>
                {statistics.negativeChange > 0 ? (
                  <>
                    <TrendingUp size={14} color={Colors.error} />
                    <Text style={[styles.trendText, styles.negativeTrend]}>
                      {statistics.negativeChange}%
                    </Text>
                  </>
                ) : statistics.negativeChange < 0 ? (
                  <>
                    <TrendingDown size={14} color={Colors.success} />
                    <Text style={[styles.trendText, styles.positiveTrend]}>
                      {Math.abs(statistics.negativeChange)}%
                    </Text>
                  </>
                ) : (
                  <Text style={styles.trendText}>No change</Text>
                )}
              </View>
            </View>
          </View>
          
          {statistics.topReasons.length > 0 && (
            <View style={styles.topReasonsContainer}>
              <Text style={styles.topReasonsTitle}>Top Reasons This Month:</Text>
              {statistics.topReasons.map((item, index) => (
                <View key={index} style={styles.reasonItem}>
                  <Text style={styles.reasonRank}>{index + 1}.</Text>
                  <Text style={styles.reasonText} numberOfLines={1}>{item.reason}</Text>
                  <Text style={styles.reasonCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'pellets' && styles.activeTab
          ]}
          onPress={() => setActiveTab('pellets')}
        >
          <Trophy size={16} color={activeTab === 'pellets' ? Colors.primary : iconColor} />
          <Text style={[
            styles.tabText,
            activeTab === 'pellets' && styles.activeTabText
          ]}>Pellet Rankings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'experience' && styles.activeTab
          ]}
          onPress={() => setActiveTab('experience')}
        >
          <Award size={16} color={activeTab === 'experience' ? Colors.primary : iconColor} />
          <Text style={[
            styles.tabText,
            activeTab === 'experience' && styles.activeTabText
          ]}>Experience Rankings</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'pellets' && (
        <>
          {useDatabase && pelletLeaderboardQuery.isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading leaderboard data...</Text>
            </View>
          )}
          
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[
                styles.filterButton,
                pelletType === 'all' && styles.activeFilterButton
              ]}
              onPress={() => setPelletType('all')}
            >
              <Trophy size={16} color={pelletType === 'all' ? Colors.primary : iconColor} />
              <Text style={[
                styles.filterText,
                pelletType === 'all' && styles.activeFilterText
              ]}>All</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterButton,
                pelletType === 'negative' && styles.activeFilterButton
              ]}
              onPress={() => setPelletType('negative')}
            >
              <ThumbsDown size={16} color={pelletType === 'negative' ? Colors.primary : iconColor} />
              <Text style={[
                styles.filterText,
                pelletType === 'negative' && styles.activeFilterText
              ]}>Negative</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterButton,
                pelletType === 'positive' && styles.positiveFilterButton
              ]}
              onPress={() => setPelletType('positive')}
            >
              <ThumbsUp size={16} color={pelletType === 'positive' ? Colors.success : iconColor} />
              <Text style={[
                styles.filterText,
                pelletType === 'positive' && styles.positiveFilterText
              ]}>Positive</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionTitle}>Anonymous Driver Rankings</Text>
          <Text style={styles.sectionSubtitle}>
            License plates are anonymized for privacy
          </Text>
          
          {sortedPelletData.length === 0 ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color={iconColor} />
              <Text style={styles.emptyStateText}>No data yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start tagging drivers to see the leaderboard
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedPelletData}
              keyExtractor={(item) => item.licensePlate}
              renderItem={renderPelletItem}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}
      
      {activeTab === 'experience' && (
        <>
          <Text style={styles.sectionTitle}>Experience Rankings</Text>
          <Text style={styles.sectionSubtitle}>
            Top reporters ranked by experience points
          </Text>
          
          {sortedExpData.length === 0 ? (
            <View style={styles.emptyState}>
              <Award size={48} color={iconColor} />
              <Text style={styles.emptyStateText}>No data yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start reporting drivers to earn experience
              </Text>
            </View>
          ) : (
            <FlatList
              data={sortedExpData}
              keyExtractor={(item) => item.id}
              renderItem={renderExpItem}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}
      
      <View style={styles.footer} />
    </ScrollView>
  );
}

const getStyles = (theme: 'light' | 'dark') => {
  const colors = {
    background: theme === 'dark' ? '#111827' : '#F9FAFB',
    card: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    text: theme === 'dark' ? '#F9FAFB' : '#1F2937',
    textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    border: theme === 'dark' ? '#374151' : '#E5E7EB',
  };
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsContainer: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    color: colors.textSecondary,
  },
  positiveTrend: {
    color: Colors.success,
  },
  negativeTrend: {
    color: Colors.error,
  },
  topReasonsContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topReasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reasonRank: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
    width: 16,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
  reasonCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary + '20',
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary + '20',
  },
  positiveFilterButton: {
    backgroundColor: Colors.success + '20',
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  positiveFilterText: {
    color: Colors.success,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positiveRankContainer: {
    backgroundColor: Colors.success,
  },
  expRankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  levelText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  countContainer: {
    alignItems: 'center',
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  positiveCountText: {
    color: Colors.success,
  },
  expCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  countLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    height: 40,
  },
  });
};
