import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PaymentItem, PaymentState } from '@/types';

// Default payment items
const DEFAULT_ITEMS: PaymentItem[] = [
  {
    id: 'pellet-5',
    name: '5 Pellets',
    description: 'Purchase 5 negative pellets to tag drivers',
    price: 1.25,
    pelletCount: 5,
    pelletType: 'negative',
    type: 'purchase',
  },
  {
    id: 'pellet-10',
    name: '10 Pellets',
    description: 'Purchase 10 negative pellets to tag drivers',
    price: 2.50,
    pelletCount: 10,
    pelletType: 'negative',
    type: 'purchase',
  },
  {
    id: 'pellet-25',
    name: '25 Pellets',
    description: 'Purchase 25 negative pellets to tag drivers',
    price: 6.25,
    pelletCount: 25,
    pelletType: 'negative',
    type: 'purchase',
  },
  {
    id: 'positive-pellet-5',
    name: '5 Positive Pellets',
    description: 'Purchase 5 positive pellets to praise good drivers',
    price: 1.25,
    pelletCount: 5,
    pelletType: 'positive',
    type: 'purchase',
  },
  {
    id: 'positive-pellet-10',
    name: '10 Positive Pellets',
    description: 'Purchase 10 positive pellets to praise good drivers',
    price: 2.50,
    pelletCount: 10,
    pelletType: 'positive',
    type: 'purchase',
  },
  {
    id: 'positive-pellet-25',
    name: '25 Positive Pellets',
    description: 'Purchase 25 positive pellets to praise good drivers',
    price: 6.25,
    pelletCount: 25,
    pelletType: 'positive',
    type: 'purchase',
  },
  {
    id: 'erase-1',
    name: 'Erase 1 Pellet',
    description: 'Remove 1 negative pellet from your record',
    price: 0.25,
    pelletCount: 1,
    pelletType: 'negative',
    type: 'erase',
  },
  {
    id: 'erase-5',
    name: 'Erase 5 Pellets',
    description: 'Remove 5 negative pellets from your record',
    price: 1.25,
    pelletCount: 5,
    pelletType: 'negative',
    type: 'erase',
  },
  {
    id: 'donation-small',
    name: 'Small Donation',
    description: 'Support Stupid Pellets with a small donation',
    price: 5.00,
    type: 'donation',
  },
  {
    id: 'donation-medium',
    name: 'Medium Donation',
    description: 'Support Stupid Pellets with a medium donation',
    price: 10.00,
    type: 'donation',
  },
  {
    id: 'donation-large',
    name: 'Large Donation',
    description: 'Support Stupid Pellets with a large donation',
    price: 25.00,
    type: 'donation',
  },
];

type PaymentStore = PaymentState & {
  initializeStore: () => void;
  processPurchase: (itemId: string, userId: string) => Promise<boolean>;
  getItemById: (itemId: string) => PaymentItem | undefined;
  getPurchasesByUser: (userId: string) => any[];
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      items: DEFAULT_ITEMS,
      purchaseHistory: [],
      isLoading: false,
      error: null,
      initializeStore: () => {
        // Reset to default items if needed
        set({ items: DEFAULT_ITEMS });
      },
      processPurchase: async (itemId, userId) => {
        set({ isLoading: true, error: null });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const item = get().items.find(i => i.id === itemId);
          if (!item) {
            set({ error: 'Item not found', isLoading: false });
            return false;
          }
          
          // Create purchase record
          const purchase = {
            id: `purchase-${Date.now()}`,
            itemId,
            userId,
            amount: item.price,
            date: Date.now(),
            status: 'completed' as const,
          };
          
          set(state => ({
            purchaseHistory: [...state.purchaseHistory, purchase],
            isLoading: false,
          }));
          
          return true;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Payment processing failed', 
            isLoading: false 
          });
          return false;
        }
      },
      getItemById: (itemId) => {
        return get().items.find(item => item.id === itemId);
      },
      getPurchasesByUser: (userId) => {
        return get().purchaseHistory.filter(purchase => purchase.userId === userId);
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'payment-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default usePaymentStore;