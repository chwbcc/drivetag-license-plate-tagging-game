import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Badge, BadgeState } from '@/types';
import useAuthStore from './auth-store';
import usePelletStore from './pellet-store';

// Default badges
const DEFAULT_BADGES: Badge[] = [
  {
    id: 'first-tag',
    name: 'First Tag',
    description: 'Tagged your first driver',
    icon: '🎯',
    criteria: {
      type: 'pellets_given',
      threshold: 1
    },
    rarity: 'common'
  },
  {
    id: 'tag-master',
    name: 'Tag Master',
    description: 'Tagged 10 drivers',
    icon: '🏆',
    criteria: {
      type: 'pellets_given',
      threshold: 10
    },
    rarity: 'uncommon'
  },
  {
    id: 'tag-legend',
    name: 'Tag Legend',
    description: 'Tagged 50 drivers',
    icon: '👑',
    criteria: {
      type: 'pellets_given',
      threshold: 50
    },
    rarity: 'rare'
  },
  {
    id: 'first-positive',
    name: 'First Positive',
    description: 'Gave your first positive tag',
    icon: '👍',
    criteria: {
      type: 'positive_pellets_given',
      threshold: 1
    },
    rarity: 'common'
  },
  {
    id: 'positivity-spreader',
    name: 'Positivity Spreader',
    description: 'Gave 10 positive tags',
    icon: '😊',
    criteria: {
      type: 'positive_pellets_given',
      threshold: 10
    },
    rarity: 'uncommon'
  },
  {
    id: 'road-angel',
    name: 'Road Angel',
    description: 'Received 5 positive tags',
    icon: '😇',
    criteria: {
      type: 'positive_pellets_received',
      threshold: 5
    },
    rarity: 'rare'
  },
  {
    id: 'road-menace',
    name: 'Road Menace',
    description: 'Received 5 negative tags',
    icon: '😈',
    criteria: {
      type: 'negative_pellets_received',
      threshold: 5
    },
    rarity: 'uncommon'
  },
  {
    id: 'infamous-driver',
    name: 'Infamous Driver',
    description: 'Received 20 negative tags',
    icon: '💀',
    criteria: {
      type: 'negative_pellets_received',
      threshold: 20
    },
    rarity: 'epic'
  },
  {
    id: 'balanced-driver',
    name: 'Balanced Driver',
    description: 'Received equal numbers of positive and negative tags (at least 5 each)',
    icon: '⚖️',
    criteria: {
      type: 'negative_pellets_received',
      threshold: 5
    },
    rarity: 'legendary'
  },
  // Experience-based badges
  {
    id: 'rookie-reporter',
    name: 'Rookie Reporter',
    description: 'Earned 100 experience points',
    icon: '🔰',
    criteria: {
      type: 'exp_earned',
      threshold: 100
    },
    rarity: 'common'
  },
  {
    id: 'experienced-reporter',
    name: 'Experienced Reporter',
    description: 'Earned 500 experience points',
    icon: '📊',
    criteria: {
      type: 'exp_earned',
      threshold: 500
    },
    rarity: 'uncommon'
  },
  {
    id: 'expert-reporter',
    name: 'Expert Reporter',
    description: 'Earned 1,000 experience points',
    icon: '📈',
    criteria: {
      type: 'exp_earned',
      threshold: 1000
    },
    rarity: 'rare'
  },
  {
    id: 'master-reporter',
    name: 'Master Reporter',
    description: 'Earned 5,000 experience points',
    icon: '🎓',
    criteria: {
      type: 'exp_earned',
      threshold: 5000
    },
    rarity: 'epic'
  },
  {
    id: 'legendary-reporter',
    name: 'Legendary Reporter',
    description: 'Earned 10,000 experience points',
    icon: '🏅',
    criteria: {
      type: 'exp_earned',
      threshold: 10000
    },
    rarity: 'legendary'
  },
  {
    id: 'level-5-achiever',
    name: 'Level 5 Achiever',
    description: 'Reached level 5',
    icon: '5️⃣',
    criteria: {
      type: 'exp_earned',
      threshold: 1000 // Level 5 requires 1000 exp
    },
    rarity: 'rare'
  },
  {
    id: 'level-10-achiever',
    name: 'Level 10 Achiever',
    description: 'Reached level 10',
    icon: '🔟',
    criteria: {
      type: 'exp_earned',
      threshold: 10000 // Level 10 requires 10000 exp
    },
    rarity: 'epic'
  }
];

type BadgeStore = BadgeState & {
  initializeBadges: () => void;
  getBadgeById: (id: string) => Badge | undefined;
  checkAndAwardBadges: (userId: string) => string[]; // Returns array of newly awarded badge IDs
  getUserBadges: (userId: string) => Badge[];
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
};

const useBadgeStore = create<BadgeStore>()(
  persist(
    (set, get) => ({
      badges: DEFAULT_BADGES,
      isLoading: false,
      error: null,
      initializeBadges: () => {
        set({ badges: DEFAULT_BADGES });
      },
      getBadgeById: (id) => {
        return get().badges.find(badge => badge.id === id);
      },
      checkAndAwardBadges: (userId) => {
        const user = useAuthStore.getState().user;
        if (!user || user.id !== userId) return [];
        
        const pelletStore = usePelletStore.getState();
        const userBadges = user.badges || [];
        const newBadges: string[] = [];
        
        // Get counts for different criteria
        const negativePelletsReceived = pelletStore.getPelletsByLicensePlate(user.licensePlate, 'negative').length;
        const positivePelletsReceived = pelletStore.getPelletsByLicensePlate(user.licensePlate, 'positive').length;
        const pelletsGiven = pelletStore.getPelletsCreatedByUser(userId).length;
        const positivePelletsGiven = pelletStore.getPelletsCreatedByUser(userId, 'positive').length;
        const expEarned = user.exp || 0;
        
        // Check each badge
        get().badges.forEach(badge => {
          if (userBadges.includes(badge.id)) return; // Skip if already awarded
          
          let meetsThreshold = false;
          
          switch (badge.criteria.type) {
            case 'negative_pellets_received':
              meetsThreshold = negativePelletsReceived >= badge.criteria.threshold;
              break;
            case 'positive_pellets_received':
              meetsThreshold = positivePelletsReceived >= badge.criteria.threshold;
              break;
            case 'pellets_given':
              meetsThreshold = pelletsGiven >= badge.criteria.threshold;
              break;
            case 'positive_pellets_given':
              meetsThreshold = positivePelletsGiven >= badge.criteria.threshold;
              break;
            case 'exp_earned':
              meetsThreshold = expEarned >= badge.criteria.threshold;
              break;
          }
          
          // Special case for balanced driver badge
          if (badge.id === 'balanced-driver') {
            meetsThreshold = negativePelletsReceived >= badge.criteria.threshold && 
                            positivePelletsReceived >= badge.criteria.threshold &&
                            Math.abs(negativePelletsReceived - positivePelletsReceived) <= 2;
          }
          
          if (meetsThreshold) {
            useAuthStore.getState().addBadge(badge.id);
            newBadges.push(badge.id);
          }
        });
        
        return newBadges;
      },
      getUserBadges: (userId) => {
        const user = useAuthStore.getState().user;
        if (!user || user.id !== userId) return [];
        
        const userBadgeIds = user.badges || [];
        return get().badges.filter(badge => userBadgeIds.includes(badge.id));
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'badge-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useBadgeStore;