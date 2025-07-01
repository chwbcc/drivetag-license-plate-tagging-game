import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Trophy, ArrowUp, ArrowDown, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, BarChart, Award } from 'lucide-react-native';
import Colors from '@/constants/colors';
import usePelletStore from '@/store/pellet-store';
import useAuthStore from '@/store/auth-store';
import { hashLicensePlate, calculateStatistics } from '@/utils/hash';

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
  const { pellets } = usePelletStore();
  const { getAllUsers } = useAuthStore();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pelletType, setPelletType] = useState<'negative' | 'positive' | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'pellets' | 'experience'>('pellets');
  
  // Filter pellets by type
  const filteredPellets = pelletType === 'all' 
    ? pellets 
    : pellets.filter(pellet => pellet.type === pelletType);
  
  // Group pellets by license plate
  const leaderboardData: LeaderboardItem[] = React.useMemo(() => {
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
  }, [filteredPellets]);
  
  // Get experience leaderboard data
  const expLeaderboardData: ExpLeaderboardItem[] = React.useMemo(() => {
    const users = getAllUsers();
    return users.map(user => ({
      id: user.id,
      name: user.name || user.email.split('@')[0],
      exp: user.exp || 0,
      level: user.level || 1
    }));
  }, [getAllUsers]);
  
  // Sort the data
  const sortedPelletData = [...leaderboardData].sort((a, b) => {
    return sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
  });
  
  const sortedExpData = [...expLeaderboardData].sort((a, b) => {
    return sortOrder === 'desc' ? b.exp - a.exp : a.exp - b.exp;
  });
  
  // Calculate statistics
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
            <ArrowDown size={20} color={Colors.text} />
          ) : (
            <ArrowUp size={20} color={Colors.text} />
          )}
        </TouchableOpacity>
      </View>
      
      {statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <BarChart size={20} color={Colors.text} />
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
          <Trophy size={16} color={activeTab === 'pellets' ? Colors.primary : Colors.textSecondary} />
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
          <Award size={16} color={activeTab === 'experience' ? Colors.primary : Colors.textSecondary} />
          <Text style={[
            styles.tabText,
            activeTab === 'experience' && styles.activeTabText
          ]}>Experience Rankings</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'pellets' && (
        <>
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[
                styles.filterButton,
                pelletType === 'all' && styles.activeFilterButton
              ]}
              onPress={() => setPelletType('all')}
            >
              <Trophy size={16} color={pelletType === 'all' ? Colors.primary : Colors.textSecondary} />
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
              <ThumbsDown size={16} color={pelletType === 'negative' ? Colors.primary : Colors.textSecondary} />
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
              <ThumbsUp size={16} color={pelletType === 'positive' ? Colors.success : Colors.textSecondary} />
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
              <Trophy size={48} color={Colors.textSecondary} />
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
              <Award size={48} color={Colors.textSecondary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    color: Colors.textSecondary,
  },
  positiveTrend: {
    color: Colors.success,
  },
  negativeTrend: {
    color: Colors.error,
  },
  topReasonsContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topReasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
    color: Colors.text,
    marginRight: 8,
    width: 16,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
  },
  reasonCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary + '20', // 20% opacity
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary + '20', // 20% opacity
  },
  positiveFilterButton: {
    backgroundColor: Colors.success + '20', // 20% opacity
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  positiveRankContainer: {
    backgroundColor: Colors.success,
  },
  expRankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  licensePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  levelText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  countContainer: {
    alignItems: 'center',
  },
  countText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  positiveCountText: {
    color: Colors.success,
  },
  expCountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  countLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '80%',
  },
  footer: {
    height: 40,
  },
});