import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Settings, Store, DollarSign, Package, RotateCcw, Check, X, ChevronDown, ChevronUp, Tag, Shield, Heart, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import useAuthStore from '@/store/auth-store';
import { useTheme } from '@/store/theme-store';
import { darkMode } from '@/constants/styles';
import usePaymentStore from '@/store/payment-store';
import { PaymentItem } from '@/types';

type EditingState = {
  [itemId: string]: {
    price?: string;
    pelletCount?: string;
  };
};

export default function AdminSettingsScreen() {
  const { user } = useAuthStore();
  const { isDark } = useTheme();
  const { items, updateItem, resetToDefaults } = usePaymentStore();
  const [editing, setEditing] = useState<EditingState>({});
  const [expandedSection, setExpandedSection] = useState<string | null>('purchase');

  const bgColor = isDark ? darkMode.background : Colors.background;
  const cardColor = isDark ? darkMode.card : Colors.card;
  const textColor = isDark ? darkMode.text : Colors.text;
  const textSecondary = isDark ? darkMode.textSecondary : Colors.textSecondary;
  const borderColor = isDark ? darkMode.border : Colors.border;
  const inputBg = isDark ? '#0F172A' : '#F1F5F9';

  if (user?.adminRole !== 'super_admin') {
    router.replace('/admin');
    return null;
  }

  const startEditing = useCallback((item: PaymentItem) => {
    setEditing(prev => ({
      ...prev,
      [item.id]: {
        price: item.price.toFixed(2),
        pelletCount: item.pelletCount?.toString() || '',
      },
    }));
  }, []);

  const cancelEditing = useCallback((itemId: string) => {
    setEditing(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const saveItem = useCallback((itemId: string) => {
    const edits = editing[itemId];
    if (!edits) return;

    const price = parseFloat(edits.price || '0');
    const pelletCount = parseInt(edits.pelletCount || '0', 10);

    if (isNaN(price) || price < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price (0 or greater).');
      return;
    }

    if (edits.pelletCount !== '' && (isNaN(pelletCount) || pelletCount < 0)) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity (0 or greater).');
      return;
    }

    const updates: Partial<Pick<PaymentItem, 'price' | 'pelletCount'>> = { price };
    if (edits.pelletCount !== '') {
      updates.pelletCount = pelletCount;
    }

    updateItem(itemId, updates);
    cancelEditing(itemId);
    console.log(`[AdminSettings] Updated item ${itemId}:`, updates);
  }, [editing, updateItem, cancelEditing]);

  const handleResetDefaults = useCallback(() => {
    Alert.alert(
      'Reset Shop Defaults',
      'This will reset all shop items to their original prices and quantities. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetToDefaults();
            setEditing({});
            console.log('[AdminSettings] Reset all items to defaults');
          },
        },
      ]
    );
  }, [resetToDefaults]);

  const sections = [
    { key: 'purchase', label: 'Buy Pellets', icon: Tag, color: Colors.primary },
    { key: 'erase', label: 'Erase Pellets', icon: Shield, color: '#8B5CF6' },
    { key: 'donation', label: 'Donations', icon: Heart, color: Colors.secondary },
  ];

  const getItemsByType = (type: string) => items.filter(i => i.type === type);

  const getTypeIcon = (item: PaymentItem) => {
    if (item.type === 'donation') return <Heart size={18} color={Colors.secondary} />;
    if (item.pelletType === 'positive') return <ThumbsUp size={18} color={Colors.success} />;
    return <ThumbsDown size={18} color={Colors.primary} />;
  };

  const renderItemRow = (item: PaymentItem) => {
    const isEditing = !!editing[item.id];
    const isPositive = item.pelletType === 'positive';
    const accentColor = item.type === 'donation' ? Colors.secondary : isPositive ? Colors.success : Colors.primary;

    return (
      <View
        key={item.id}
        style={[
          styles.itemRow,
          { backgroundColor: cardColor, borderColor },
          isEditing && { borderColor: accentColor, borderWidth: 1.5 },
        ]}
      >
        <View style={styles.itemRowTop}>
          <View style={[styles.itemIcon, { backgroundColor: accentColor + '15' }]}>
            {getTypeIcon(item)}
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { color: textColor }]}>{item.name}</Text>
            <Text style={[styles.itemDesc, { color: textSecondary }]} numberOfLines={1}>
              {item.description}
            </Text>
          </View>
          {!isEditing ? (
            <TouchableOpacity
              style={[styles.editBtn, { backgroundColor: accentColor + '12' }]}
              onPress={() => startEditing(item)}
            >
              <Text style={[styles.editBtnText, { color: accentColor }]}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.success + '15' }]}
                onPress={() => saveItem(item.id)}
              >
                <Check size={18} color={Colors.success} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.error + '15' }]}
                onPress={() => cancelEditing(item.id)}
              >
                <X size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editFields}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Price ($)</Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
                <DollarSign size={14} color={textSecondary} />
                <TextInput
                  style={[styles.input, { color: textColor }]}
                  value={editing[item.id]?.price}
                  onChangeText={(val) =>
                    setEditing(prev => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], price: val },
                    }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={textSecondary}
                  selectTextOnFocus
                />
              </View>
            </View>
            {item.pelletCount !== undefined && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Quantity</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor }]}>
                  <Package size={14} color={textSecondary} />
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={editing[item.id]?.pelletCount}
                    onChangeText={(val) =>
                      setEditing(prev => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], pelletCount: val },
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={textSecondary}
                    selectTextOnFocus
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.valueRow}>
            <View style={styles.valuePill}>
              <DollarSign size={12} color={accentColor} />
              <Text style={[styles.valueText, { color: textColor }]}>
                {item.price.toFixed(2)}
              </Text>
            </View>
            {item.pelletCount !== undefined && (
              <View style={styles.valuePill}>
                <Package size={12} color={accentColor} />
                <Text style={[styles.valueText, { color: textColor }]}>
                  {item.pelletCount} pellets
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Admin Settings',
          headerBackTitle: 'Admin',
        }}
      />

      <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { backgroundColor: cardColor, borderColor }]}>
          <View style={styles.headerRow}>
            <View style={[styles.headerIcon, { backgroundColor: '#FFD700' + '20' }]}>
              <Settings size={22} color="#FFD700" />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Admin Configuration</Text>
              <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
                Manage shop pricing and quantities
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: Colors.primary + '15' }]}>
            <Store size={18} color={Colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Shop Management</Text>
        </View>

        {sections.map(section => {
          const sectionItems = getItemsByType(section.key);
          const isExpanded = expandedSection === section.key;
          const Icon = section.icon;

          return (
            <View key={section.key} style={styles.sectionBlock}>
              <TouchableOpacity
                style={[styles.sectionToggle, { backgroundColor: cardColor, borderColor }]}
                onPress={() => setExpandedSection(isExpanded ? null : section.key)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionToggleLeft}>
                  <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
                  <Icon size={18} color={section.color} />
                  <Text style={[styles.sectionToggleText, { color: textColor }]}>{section.label}</Text>
                  <View style={[styles.countBadge, { backgroundColor: section.color + '15' }]}>
                    <Text style={[styles.countBadgeText, { color: section.color }]}>{sectionItems.length}</Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color={textSecondary} />
                ) : (
                  <ChevronDown size={20} color={textSecondary} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.sectionItems}>
                  {sectionItems.map(renderItemRow)}
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.resetButton, { borderColor: Colors.error + '40' }]}
          onPress={handleResetDefaults}
          activeOpacity={0.7}
        >
          <RotateCcw size={18} color={Colors.error} />
          <Text style={[styles.resetButtonText, { color: Colors.error }]}>Reset All to Defaults</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
    gap: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  sectionBlock: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionToggleText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  sectionItems: {
    marginTop: 6,
    gap: 6,
  },
  itemRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  itemRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  itemDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  editActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editFields: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  fieldGroup: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  valueRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
