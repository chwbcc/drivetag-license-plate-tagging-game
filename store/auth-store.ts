import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User } from '@/types';

// Experience required for each level
const EXP_LEVELS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  1000,   // Level 5
  2000,   // Level 6
  3500,   // Level 7
  5000,   // Level 8
  7500,   // Level 9
  10000,  // Level 10
  15000,  // Level 11
  20000,  // Level 12
  30000,  // Level 13
  50000,  // Level 14
  75000,  // Level 15
];

// Calculate level based on experience
const calculateLevel = (exp: number): number => {
  let level = 1;
  for (let i = 1; i < EXP_LEVELS.length; i++) {
    if (exp >= EXP_LEVELS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
};

type AuthStore = AuthState & {
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  changeLicensePlate: (newPlate: string, state?: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean; // Returns true if password was changed
  addPellets: (count: number, type?: 'negative' | 'positive') => void;
  removePellets: (count: number, type?: 'negative' | 'positive') => boolean; // Returns false if not enough pellets
  addBadge: (badgeId: string) => void;
  addExp: (amount: number) => boolean; // Return true if leveled up
  getExpForNextLevel: () => { current: number, next: number, progress: number };
  getAllUsers: () => User[];
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
};

// Mock users for leaderboard
const MOCK_USERS: User[] = [
  {
    id: '2',
    email: 'driver2@example.com',
    name: 'Jane Smith',
    licensePlate: 'XYZ789',
    state: 'CA',
    pelletCount: 5,
    positivePelletCount: 3,
    badges: ['first-tag', 'first-positive'],
    exp: 750,
    level: 4
  },
  {
    id: '3',
    email: 'driver3@example.com',
    name: 'Bob Johnson',
    licensePlate: 'DEF456',
    state: 'NY',
    pelletCount: 8,
    positivePelletCount: 2,
    badges: ['first-tag'],
    exp: 320,
    level: 3
  },
  {
    id: '4',
    email: 'driver4@example.com',
    name: 'Alice Brown',
    licensePlate: 'GHI789',
    state: 'TX',
    pelletCount: 12,
    positivePelletCount: 6,
    badges: ['first-tag', 'first-positive', 'tag-master'],
    exp: 1200,
    level: 5
  },
  {
    id: '5',
    email: 'driver5@example.com',
    name: 'Charlie Davis',
    licensePlate: 'JKL012',
    state: 'FL',
    pelletCount: 3,
    positivePelletCount: 1,
    badges: ['first-tag'],
    exp: 180,
    level: 2
  }
];

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },
      login: (user) => {
        set({ 
          user: {
            ...user,
            exp: user.exp || 0,
            level: user.level || calculateLevel(user.exp || 0)
          }, 
          error: null 
        });
      },
      logout: () => set({ user: null, error: null }),
      register: (user) => {
        set({ 
          user: {
            ...user,
            exp: user.exp || 0,
            level: user.level || 1
          }, 
          error: null 
        });
      },
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
      changeLicensePlate: (newPlate, state) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { 
              ...currentUser, 
              licensePlate: newPlate,
              state: state || currentUser.state
            } 
          });
        }
      },
      changePassword: (currentPassword, newPassword) => {
        const currentUser = get().user;
        if (!currentUser) return false;
        
        if (currentUser.password !== currentPassword) {
          return false;
        }
        
        set({ 
          user: { 
            ...currentUser, 
            password: newPassword
          } 
        });
        return true;
      },
      addPellets: (count, type = 'negative') => {
        const currentUser = get().user;
        if (currentUser) {
          if (type === 'positive') {
            set({ 
              user: { 
                ...currentUser, 
                positivePelletCount: (currentUser.positivePelletCount || 0) + count 
              } 
            });
          } else {
            set({ 
              user: { 
                ...currentUser, 
                pelletCount: currentUser.pelletCount + count 
              } 
            });
          }
        }
      },
      removePellets: (count, type = 'negative') => {
        const currentUser = get().user;
        if (currentUser) {
          if (type === 'positive') {
            const currentCount = currentUser.positivePelletCount || 0;
            if (currentCount >= count) {
              set({ 
                user: { 
                  ...currentUser, 
                  positivePelletCount: currentCount - count 
                } 
              });
              return true;
            }
          } else {
            if (currentUser.pelletCount >= count) {
              set({ 
                user: { 
                  ...currentUser, 
                  pelletCount: currentUser.pelletCount - count 
                } 
              });
              return true;
            }
          }
        }
        return false;
      },
      addBadge: (badgeId) => {
        const currentUser = get().user;
        if (currentUser) {
          const badges = currentUser.badges || [];
          if (!badges.includes(badgeId)) {
            set({
              user: {
                ...currentUser,
                badges: [...badges, badgeId]
              }
            });
          }
        }
      },
      addExp: (amount) => {
        const currentUser = get().user;
        if (currentUser) {
          const newExp = (currentUser.exp || 0) + amount;
          const newLevel = calculateLevel(newExp);
          const leveledUp = newLevel > (currentUser.level || 1);
          
          set({
            user: {
              ...currentUser,
              exp: newExp,
              level: newLevel
            }
          });
          
          return leveledUp;
        }
        return false;
      },
      getExpForNextLevel: () => {
        const currentUser = get().user;
        if (!currentUser) return { current: 0, next: 100, progress: 0 };
        
        const currentExp = currentUser.exp || 0;
        const currentLevel = currentUser.level || 1;
        
        if (currentLevel >= EXP_LEVELS.length) {
          // Max level reached
          const maxLevelExp = EXP_LEVELS[EXP_LEVELS.length - 1];
          return { 
            current: currentExp - maxLevelExp, 
            next: 0, 
            progress: 100 
          };
        }
        
        const currentLevelExp = EXP_LEVELS[currentLevel - 1];
        const nextLevelExp = EXP_LEVELS[currentLevel];
        const expNeeded = nextLevelExp - currentLevelExp;
        const expProgress = currentExp - currentLevelExp;
        const progress = Math.min(100, Math.max(0, Math.round((expProgress / expNeeded) * 100)));
        
        return {
          current: expProgress,
          next: expNeeded,
          progress
        };
      },
      getAllUsers: () => {
        const currentUser = get().user;
        if (!currentUser) return MOCK_USERS;
        
        // Return mock users plus the current user
        return [currentUser, ...MOCK_USERS];
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;