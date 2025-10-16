import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { ShoppingCart, Tag, Shield, Heart, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import useAuthStore from '@/store/auth-store';
import usePaymentStore from '@/store/payment-store';
import usePelletStore from '@/store/pellet-store';
import { PaymentItem } from '@/types';

export default function ShopScreen() {
  const { user, addPellets } = useAuthStore();
  const { items, processPurchase, isLoading } = usePaymentStore();
  const { pellets, removePellet } = usePelletStore();
  const [activeTab, setActiveTab] = useState<'purchase' | 'erase' | 'donation'>('purchase');
  const [pelletType, setPelletType] = useState<'negative' | 'positive'>('negative');
  
  // Filter items by type and pellet type
  const filteredItems = items.filter(item => {
    if (item.type !== activeTab) return false;
    if (activeTab === 'purchase' || activeTab === 'erase') {
      return item.pelletType === pelletType;
    }
    return true;
  });
  
  const myPellets = user ? pellets.filter(
    pellet => {
      const userLicensePlateWithState = user.state && !user.licensePlate.includes('-') 
        ? `${user.state}-${user.licensePlate}` 
        : user.licensePlate;
      return pellet.targetLicensePlate.toLowerCase() === userLicensePlateWithState.toLowerCase() &&
             pellet.type === pelletType;
    }
  ) : [];
  
  const handlePurchase = async (item: PaymentItem) => {
    if (!user) {
      Alert.alert('Error', 'You need to be logged in to make a purchase');
      return;
    }
    
    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to purchase ${item.name} for $${item.price.toFixed(2)}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Purchase',
          onPress: async () => {
            if (await processPurchase(item.id, user.id)) {
              if (item.type === 'purchase' && item.pelletCount) {
                addPellets(item.pelletCount, item.pelletType);
                Alert.alert('Success', `You've purchased ${item.pelletCount} ${item.pelletType} pellets!`);
              } else if (item.type === 'erase' && item.pelletCount) {
                if (myPellets.length === 0) {
                  Alert.alert('No Pellets', `You have no ${pelletType} pellets to erase from your record.`);
                  return;
                }
                
                const pelletsToRemove = Math.min(item.pelletCount, myPellets.length);
                const removedPellets: string[] = [];
                
                for (let i = 0; i < pelletsToRemove; i++) {
                  if (myPellets[i]) {
                    removePellet(myPellets[i].id);
                    removedPellets.push(myPellets[i].id);
                  }
                }
                
                console.log(`Removed ${removedPellets.length} ${pelletType} pellets:`, removedPellets);
                Alert.alert(
                  'Success', 
                  `You've successfully erased ${removedPellets.length} ${pelletType} pellet${removedPellets.length !== 1 ? 's' : ''} from your record!`
                );
              } else if (item.type === 'donation') {
                Alert.alert('Thank You!', 'Your donation helps us keep the roads safer!');
              }
            } else {
              Alert.alert('Error', 'Payment processing failed. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  const renderItem = ({ item }: { item: PaymentItem }) => {
    const isPositive = item.pelletType === 'positive';
    
    return (
      <TouchableOpacity 
        style={[
          styles.itemCard,
          isPositive && styles.positiveItemCard
        ]}
        onPress={() => handlePurchase(item)}
        disabled={isLoading}
      >
        <View style={styles.itemHeader}>
          <View style={[
            styles.itemIconContainer,
            isPositive && styles.positiveItemIconContainer
          ]}>
            {item.type === 'purchase' && !isPositive && <ThumbsDown size={24} color={Colors.primary} />}
            {item.type === 'purchase' && isPositive && <ThumbsUp size={24} color={Colors.success} />}
            {item.type === 'erase' && !isPositive && <Shield size={24} color={Colors.primary} />}
            {item.type === 'erase' && isPositive && <Shield size={24} color={Colors.success} />}
            {item.type === 'donation' && <Heart size={24} color={Colors.secondary} />}
          </View>
          <Text style={styles.itemName}>{item.name}</Text>
        </View>
        
        <Text style={styles.itemDescription}>{item.description}</Text>
        
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          <Button 
            title="Buy" 
            variant="primary" 
            style={[
              styles.buyButton,
              isPositive && styles.positiveBuyButton
            ]}
            textStyle={styles.buyButtonText}
            loading={isLoading}
            onPress={() => handlePurchase(item)}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pellet Shop</Text>
        <View style={styles.pelletCountContainer}>
          <View style={styles.pelletCount}>
            <Text style={styles.pelletCountLabel}>Negative:</Text>
            <Text style={styles.pelletCountValue}>{user?.pelletCount || 0}</Text>
          </View>
          <View style={styles.pelletCount}>
            <Text style={styles.pelletCountLabel}>Positive:</Text>
            <Text style={[styles.pelletCountValue, styles.positivePelletCount]}>
              {user?.positivePelletCount || 0}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'purchase' && styles.activeTab
          ]}
          onPress={() => setActiveTab('purchase')}
        >
          <Tag size={16} color={activeTab === 'purchase' ? Colors.primary : Colors.textSecondary} />
          <Text style={[
            styles.tabText,
            activeTab === 'purchase' && styles.activeTabText
          ]}>Buy Pellets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'erase' && styles.activeTab
          ]}
          onPress={() => setActiveTab('erase')}
        >
          <Shield size={16} color={activeTab === 'erase' ? Colors.primary : Colors.textSecondary} />
          <Text style={[
            styles.tabText,
            activeTab === 'erase' && styles.activeTabText
          ]}>Erase Pellets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'donation' && styles.activeTab
          ]}
          onPress={() => setActiveTab('donation')}
        >
          <Heart size={16} color={activeTab === 'donation' ? Colors.primary : Colors.textSecondary} />
          <Text style={[
            styles.tabText,
            activeTab === 'donation' && styles.activeTabText
          ]}>Donate</Text>
        </TouchableOpacity>
      </View>
      
      {(activeTab === 'purchase' || activeTab === 'erase') && (
        <View style={styles.pelletTypeSelector}>
          <TouchableOpacity 
            style={[
              styles.pelletTypeButton, 
              pelletType === 'negative' && styles.activePelletTypeButton
            ]}
            onPress={() => setPelletType('negative')}
          >
            <ThumbsDown 
              size={16} 
              color={pelletType === 'negative' ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              styles.pelletTypeText,
              pelletType === 'negative' && styles.activePelletTypeText
            ]}>Negative</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.pelletTypeButton, 
              pelletType === 'positive' && styles.positivePelletTypeButton
            ]}
            onPress={() => setPelletType('positive')}
          >
            <ThumbsUp 
              size={16} 
              color={pelletType === 'positive' ? Colors.success : Colors.textSecondary} 
            />
            <Text style={[
              styles.pelletTypeText,
              pelletType === 'positive' && styles.positivePelletTypeText
            ]}>Positive</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  pelletCountContainer: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pelletCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pelletCountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  pelletCountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  positivePelletCount: {
    color: Colors.success,
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
  pelletTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  pelletTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
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
    color: Colors.textSecondary,
  },
  activePelletTypeText: {
    color: Colors.primary,
    fontWeight: '500',
  },
  positivePelletTypeText: {
    color: Colors.success,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  positiveItemCard: {
    borderColor: Colors.success + '30',
    backgroundColor: Colors.success + '05',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  positiveItemIconContainer: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success + '30',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  buyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  positiveBuyButton: {
    backgroundColor: Colors.success,
  },
  buyButtonText: {
    fontSize: 14,
  },
});