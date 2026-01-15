import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Trophy, ArrowUp, ArrowDown, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, BarChart, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { hashLicensePlate } from '@/utils/hash';
import { useTheme } from '@/store/theme-store';
import { useLeaderboardPellets, useLeaderboardExperience, useAllPelletsForStats } from '@/hooks/useUserData';

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
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pelletType, setPelletType] = useState<'negative' | 'positive' | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'pellets' | 'experience'>('pellets');
  
  const { data: pelletData = [], isLoading: pelletsLoading } = useLeaderboardPellets(sortOrder, pelletType);
  const { data: expData = [], isLoading: expLoading } = useLeaderboardExperience(sortOrder);
  const { data: allPellets = [] } = useAllPelletsForStats();
  
  const styles = getStyles(theme);
  const iconColor = theme === 'dark' ? '#9CA3AF' : Colors.textSecondary;
  const textColor = theme === 'dark' ? '#F9FAFB' : Colors.text;
  
  const leaderboardData: LeaderboardItem[] = React.useMemo(() => {
    return pelletData.map((item: any) => ({
      licensePlate: item.licensePlate,
      hashedId: hashLicensePlate(item.licensePlate),
      count: item.count,
    }));
  }, [pelletData]);
  
  const expLeaderboardData: ExpLeaderboardItem[] = React.useMemo(() => {
    return expData.map((item: any) => ({
      id: item.id,
      name: item.name,
      exp: item.exp,
      level: item.level,
    }));
  }, [expData]);
  
  const statistics = React.useMemo(() => {
    if (allPellets.length === 0) return null;
    
    const total = allPellets.length;
    const positive = allPellets.filter((p: any) => p.type === 'positive').length;
    const negative = allPellets.filter((p: any) => p.type === 'negative').length;
    
    const reasonCounts = new Map<string, number>();
    allPellets.forEach((p: any) => {
      if (p.notes) {
        reasonCounts.set(p.notes, (reasonCounts.get(p.notes) || 0) + 1);
      }
    });
    
    const topReasons = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));
    
    return {
      positivePercentage: total > 0 ? Math.round((positive / total) * 100) : 0,
      negativePercentage: total > 0 ? Math.round((negative / total) * 100) : 0,
      positiveChange: 0,
      negativeChange: 0,
      topReasons,
    };
  }, [allPellets]);
  
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
          {pelletsLoading && (
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
          
          {leaderboardData.length === 0 && !pelletsLoading ? (
            <View style={styles.emptyState}>
              <Trophy size={48} color={iconColor} />
              <Text style={styles.emptyStateText}>No data yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start tagging drivers to see the leaderboard
              </Text>
            </View>
          ) : (
            <FlatList
              data={leaderboardData}
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
          {expLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading experience data...</Text>
            </View>
          )}
          
          <Text style={styles.sectionTitle}>Experience Rankings</Text>
          <Text style={styles.sectionSubtitle}>
            Top reporters ranked by experience points
          </Text>
          
          {expLeaderboardData.length === 0 && !expLoading ? (
            <View style={styles.emptyState}>
              <Award size={48} color={iconColor} />
              <Text style={styles.emptyStateText}>No data yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start reporting drivers to earn experience
              </Text>
            </View>
          ) : (
            <FlatList
              data={expLeaderboardData}
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
