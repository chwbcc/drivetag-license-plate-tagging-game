import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { Tag, Shield, Heart, ThumbsUp, ThumbsDown, RefreshCw, RotateCcw } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchasesPackage } from 'react-native-purchases';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import {
  fetchOfferings,
  purchasePackage,
  restorePurchases,
  categorizePackage,
  getPelletCountFromIdentifier,
  isRevenueCatConfigured,
  loginRevenueCat,
} from '@/store/purchases-store';

type TabType = 'purchase' | 'erase' | 'donation';
type PelletFilterType = 'negative' | 'positive';

export default function ShopScreen() {
  const { theme } = useTheme();
  const { user, addPellets, removePellets } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('purchase');
  const [pelletType, setPelletType] = useState<PelletFilterType>('negative');

  const styles = getStyles(theme);

  const offeringsQuery = useQuery({
    queryKey: ['rc-offerings'],
    queryFn: async () => {
      if (user?.id) {
        await loginRevenueCat(user.id);
      }
      const offerings = await fetchOfferings();
      console.log('[Shop] Offerings loaded:', offerings?.current?.identifier);
      return offerings;
    },
    enabled: isRevenueCatConfigured(),
    staleTime: 5 * 60 * 1000,
  });

  const packages = offeringsQuery.data?.current?.availablePackages ?? [];

  const filteredPackages = packages.filter((pkg) => {
    const cat = categorizePackage(pkg.identifier);
    if (activeTab === 'purchase') {
      if (pelletType === 'negative') return cat === 'purchase_neg';
      return cat === 'purchase_pos';
    }
    if (activeTab === 'erase') return cat === 'erase';
    return cat === 'donation';
  });

  const purchaseMutation = useMutation({
    mutationFn: async (pkg: PurchasesPackage) => {
      const result = await purchasePackage(pkg);
      return { result, pkg };
    },
    onSuccess: ({ result, pkg }) => {
      if (result.success) {
        const cat = categorizePackage(pkg.identifier);
        const count = getPelletCountFromIdentifier(pkg.identifier);

        if (cat === 'purchase_neg') {
          addPellets(count, 'negative');
        } else if (cat === 'purchase_pos') {
          addPellets(count, 'positive');
        } else if (cat === 'erase') {
          removePellets(count, 'negative');
        }

        Alert.alert('Success', `Purchase completed! ${pkg.product.title}`);
        queryClient.invalidateQueries({ queryKey: ['rc-offerings'] });
      }
    },
    onError: (error: Error) => {
      Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => restorePurchases(),
    onSuccess: () => {
      Alert.alert('Restored', 'Your purchases have been restored.');
    },
    onError: (error: Error) => {
      Alert.alert('Restore Failed', error.message || 'Could not restore purchases.');
    },
  });

  const handlePurchase = useCallback((pkg: PurchasesPackage) => {
    if (!user) {
      Alert.alert('Error', 'You need to be logged in to make a purchase');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${pkg.product.title} for ${pkg.product.priceString}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => purchaseMutation.mutate(pkg),
        },
      ]
    );
  }, [user, purchaseMutation]);

  const getIconForPackage = useCallback((identifier: string, size: number) => {
    const cat = categorizePackage(identifier);
    switch (cat) {
      case 'purchase_neg':
        return <ThumbsDown size={size} color={Colors.primary} />;
      case 'purchase_pos':
        return <ThumbsUp size={size} color={Colors.success} />;
      case 'erase':
        return <Shield size={size} color={Colors.primary} />;
      case 'donation':
        return <Heart size={size} color={Colors.secondary} />;
    }
  }, []);

  const renderPackageItem = useCallback(({ item }: { item: PurchasesPackage }) => {
    const cat = categorizePackage(item.identifier);
    const isPositive = cat === 'purchase_pos';
    const isPurchasing = purchaseMutation.isPending;

    return (
      <TouchableOpacity
        style={[styles.itemCard, isPositive && styles.positiveItemCard]}
        onPress={() => handlePurchase(item)}
        disabled={isPurchasing}
        activeOpacity={0.7}
        testID={`shop-item-${item.identifier}`}
      >
        <View style={styles.itemHeader}>
          <View style={[styles.itemIconContainer, isPositive && styles.positiveItemIconContainer]}>
            {getIconForPackage(item.identifier, 24)}
          </View>
          <View style={styles.itemTitleContainer}>
            <Text style={styles.itemName}>{item.product.title}</Text>
            {item.product.description ? (
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.product.description}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>{item.product.priceString}</Text>
          <View style={[styles.buyChip, isPositive && styles.positiveBuyChip]}>
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.buyChipText}>Buy</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [styles, handlePurchase, getIconForPackage, purchaseMutation.isPending]);

  const rcConfigured = isRevenueCatConfigured();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pellet Shop</Text>
        <View style={styles.pelletCountContainer}>
          <View style={styles.pelletCount}>
            <Text style={styles.pelletCountLabel}>Neg:</Text>
            <Text style={styles.pelletCountValue}>{user?.pelletCount || 0}</Text>
          </View>
          <View style={styles.pelletCount}>
            <Text style={styles.pelletCountLabel}>Pos:</Text>
            <Text style={[styles.pelletCountValue, styles.positivePelletCount]}>
              {user?.positivePelletCount || 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchase' && styles.activeTab]}
          onPress={() => setActiveTab('purchase')}
          testID="tab-purchase"
        >
          <Tag size={16} color={activeTab === 'purchase' ? Colors.primary : styles.tabText.color as string} />
          <Text style={[styles.tabText, activeTab === 'purchase' && styles.activeTabText]}>Buy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'erase' && styles.activeTab]}
          onPress={() => setActiveTab('erase')}
          testID="tab-erase"
        >
          <Shield size={16} color={activeTab === 'erase' ? Colors.primary : styles.tabText.color as string} />
          <Text style={[styles.tabText, activeTab === 'erase' && styles.activeTabText]}>Erase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'donation' && styles.activeTab]}
          onPress={() => setActiveTab('donation')}
          testID="tab-donate"
        >
          <Heart size={16} color={activeTab === 'donation' ? Colors.primary : styles.tabText.color as string} />
          <Text style={[styles.tabText, activeTab === 'donation' && styles.activeTabText]}>Donate</Text>
        </TouchableOpacity>
      </View>

      {(activeTab === 'purchase') && (
        <View style={styles.pelletTypeSelector}>
          <TouchableOpacity
            style={[styles.pelletTypeButton, pelletType === 'negative' && styles.activePelletTypeButton]}
            onPress={() => setPelletType('negative')}
          >
            <ThumbsDown size={16} color={pelletType === 'negative' ? Colors.primary : styles.pelletTypeText.color as string} />
            <Text style={[styles.pelletTypeText, pelletType === 'negative' && styles.activePelletTypeText]}>Negative</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pelletTypeButton, pelletType === 'positive' && styles.positivePelletTypeButton]}
            onPress={() => setPelletType('positive')}
          >
            <ThumbsUp size={16} color={pelletType === 'positive' ? Colors.success : styles.pelletTypeText.color as string} />
            <Text style={[styles.pelletTypeText, pelletType === 'positive' && styles.positivePelletTypeText]}>Positive</Text>
          </TouchableOpacity>
        </View>
      )}

      {!rcConfigured ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Shop Unavailable</Text>
          <Text style={styles.emptySubtitle}>
            {Platform.OS === 'web'
              ? 'In-app purchases are available on mobile devices.'
              : 'The store is not configured yet. Please try again later.'}
          </Text>
        </View>
      ) : offeringsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : offeringsQuery.isError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Failed to load products</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => offeringsQuery.refetch()}
          >
            <RefreshCw size={18} color={Colors.primary} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredPackages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No products available</Text>
          <Text style={styles.emptySubtitle}>Check back later for new items.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPackages}
          keyExtractor={(item) => item.identifier}
          renderItem={renderPackageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {rcConfigured && (
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => restoreMutation.mutate()}
          disabled={restoreMutation.isPending}
          testID="restore-purchases"
        >
          {restoreMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <RotateCcw size={14} color={Colors.primary} />
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
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
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    pelletCountContainer: {
      backgroundColor: colors.card,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pelletCount: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 2,
    },
    pelletCountLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 4,
    },
    pelletCountValue: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      color: Colors.primary,
    },
    positivePelletCount: {
      color: Colors.success,
    },
    tabsContainer: {
      flexDirection: 'row' as const,
      marginBottom: 10,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
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
      fontWeight: '600' as const,
    },
    pelletTypeSelector: {
      flexDirection: 'row' as const,
      marginBottom: 10,
      gap: 8,
    },
    pelletTypeButton: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: 8,
    },
    activePelletTypeButton: {
      backgroundColor: Colors.primary + '10',
      borderColor: Colors.primary,
    },
    positivePelletTypeButton: {
      backgroundColor: Colors.success + '10',
      borderColor: Colors.success,
    },
    pelletTypeText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    activePelletTypeText: {
      color: Colors.primary,
      fontWeight: '500' as const,
    },
    positivePelletTypeText: {
      color: Colors.success,
      fontWeight: '500' as const,
    },
    listContent: {
      paddingBottom: 10,
    },
    itemCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    positiveItemCard: {
      borderColor: Colors.success + '40',
    },
    itemHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 10,
    },
    itemIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.primary + '12',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: 12,
    },
    positiveItemIconContainer: {
      backgroundColor: Colors.success + '12',
    },
    itemTitleContainer: {
      flex: 1,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.text,
    },
    itemDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemFooter: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    itemPrice: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: colors.text,
    },
    buyChip: {
      backgroundColor: Colors.primary,
      paddingVertical: 7,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 70,
      alignItems: 'center' as const,
    },
    positiveBuyChip: {
      backgroundColor: Colors.success,
    },
    buyChipText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600' as const,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      paddingHorizontal: 40,
    },
    retryButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: Colors.primary + '15',
      marginTop: 8,
    },
    retryText: {
      fontSize: 14,
      color: Colors.primary,
      fontWeight: '500' as const,
    },
    restoreButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 6,
      paddingVertical: 10,
      marginTop: 4,
      marginBottom: 4,
    },
    restoreText: {
      fontSize: 13,
      color: Colors.primary,
      fontWeight: '500' as const,
    },
  });
};
