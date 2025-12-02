import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthState, User, AdminRole } from '@/types';

const SUPER_ADMIN_EMAIL = 'chwbcc@gmail.com';

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
  registeredUsers: User[];
  login: (user: User) => void;
  syncAdminRole: () => void;
  logout: () => void;
  register: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  changeLicensePlate: (newPlate: string, state?: string) => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  addPellets: (count: number, type?: 'negative' | 'positive') => void;
  removePellets: (count: number, type?: 'negative' | 'positive') => boolean;
  addBadge: (badgeId: string) => void;
  addExp: (amount: number) => boolean;
  getExpForNextLevel: () => { current: number, next: number, progress: number };
  getAllUsers: () => User[];
  findUserByEmail: (email: string) => User | undefined;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
};

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
      registeredUsers: [],
      isLoading: false,
      error: null,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state
        });
      },
      login: (user) => {
        const adminRole: AdminRole = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() 
          ? 'super_admin' 
          : user.adminRole || null;
        
        set({ 
          user: {
            ...user,
            exp: user.exp || 0,
            level: user.level || calculateLevel(user.exp || 0),
            adminRole
          }, 
          error: null 
        });
      },
      logout: () => set({ user: null, error: null }),
      syncAdminRole: () => {
        const currentUser = get().user;
        if (currentUser) {
          const adminRole: AdminRole = currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() 
            ? 'super_admin' 
            : currentUser.adminRole || null;
          
          if (currentUser.adminRole !== adminRole) {
            const updatedUser = { ...currentUser, adminRole };
            
            const registeredUsers = get().registeredUsers;
            const userIndex = registeredUsers.findIndex(u => u.id === currentUser.id);
            
            if (userIndex >= 0) {
              registeredUsers[userIndex] = updatedUser;
              set({ 
                user: updatedUser,
                registeredUsers: [...registeredUsers]
              });
            } else {
              set({ user: updatedUser });
            }
          }
        }
      },
      register: (user) => {
        const adminRole: AdminRole = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() 
          ? 'super_admin' 
          : null;
        
        const newUser = {
          ...user,
          exp: user.exp || 0,
          level: user.level || 1,
          adminRole
        };
        
        const registeredUsers = get().registeredUsers;
        const existingUserIndex = registeredUsers.findIndex(u => u.email === newUser.email);
        
        if (existingUserIndex >= 0) {
          registeredUsers[existingUserIndex] = newUser;
          set({ 
            registeredUsers: [...registeredUsers],
            user: newUser, 
            error: null 
          });
        } else {
          set({ 
            registeredUsers: [...registeredUsers, newUser],
            user: newUser, 
            error: null 
          });
        }
      },
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          
          const registeredUsers = get().registeredUsers;
          const userIndex = registeredUsers.findIndex(u => u.id === currentUser.id);
          
          if (userIndex >= 0) {
            registeredUsers[userIndex] = updatedUser;
            set({ 
              user: updatedUser,
              registeredUsers: [...registeredUsers]
            });
          } else {
            set({ user: updatedUser });
          }
        }
      },
      changeLicensePlate: (newPlate, state) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { 
            ...currentUser, 
            licensePlate: newPlate,
            state: state || currentUser.state
          };
          
          const registeredUsers = get().registeredUsers;
          const userIndex = registeredUsers.findIndex(u => u.id === currentUser.id);
          
          if (userIndex >= 0) {
            registeredUsers[userIndex] = updatedUser;
            set({ 
              user: updatedUser,
              registeredUsers: [...registeredUsers]
            });
          } else {
            set({ user: updatedUser });
          }
        }
      },
      changePassword: (currentPassword, newPassword) => {
        const currentUser = get().user;
        if (!currentUser) return false;
        
        if (currentUser.password !== currentPassword) {
          return false;
        }
        
        const updatedUser = { 
          ...currentUser, 
          password: newPassword
        };
        
        const registeredUsers = get().registeredUsers;
        const userIndex = registeredUsers.findIndex(u => u.id === currentUser.id);
        
        if (userIndex >= 0) {
          registeredUsers[userIndex] = updatedUser;
          set({ 
            user: updatedUser,
            registeredUsers: [...registeredUsers]
          });
        } else {
          set({ user: updatedUser });
        }
        return true;
      },
      addPellets: (count, type = 'negative') => {
        const currentUser = get().user;
        if (currentUser) {
          let updatedUser;
          if (type === 'positive') {
            updatedUser = { 
              ...currentUser, 
              positivePelletCount: (currentUser.positivePelletCount || 0) + count 
            };
          } else {
            updatedUser = { 
              ...currentUser, 
              pelletCount: currentUser.pelletCount + count 
            };
          }
          
          const registeredUsers = get().registeredUsers;
          const userIndex = registeredUsers.findIndex(u => u.id === currentUser.id);
          
          if (userIndex >= 0) {
            registeredUsers[userIndex] = updatedUser;
            set({ 
              user: updatedUser,
              registeredUsers: [...registeredUsers]
            });
          } else {
            set({ user: updatedUser });
          }
        }
      },
      removePellets: (count, type = 'negative') => {
        const currentUser = get().user;
        if (currentUser) {
          let updatedUser;
          if (type === 'positive') {
            const currentCount = currentUser.positivePelletCount || 0;
            if (currentCount >= count) {
              updatedUser = { 
                ...currentUser, 
                positivePelletCount: currentCount - count 
              };
            } else {
              return false;
            }
          } else {
            if (currentUser.pelletCount >= count) {
              updatedUser = { 
                ...currentUser, 
                pelletCount: currentUser.pelletCount - count 
              };
            } else {
              return false;
            }
          }
          
          const registeredUsers = get().registeredUsers;
          const userIndex = registeredUsers.findIndex(u => u.id === currentUser.id);
          
          if (userIndex >= 0) {
            registeredUsers[userIndex] = updatedUser;
            set({ 
              user: updatedUser,
              registeredUsers: [...registeredUsers]
            });
          } else {
            set({ user: updatedUser });
          }
          return true;
        }
        return false;
      },
      addBadge: (badgeId) => {
        const currentUser = get().user;
        if (currentUser) {
          const badges = currentUser.badges || [];
          if (!badges.includes(badgeId)) {
            const updatedUser = {
              ...currentUser,
              badges: [...badges, badgeId]
            };
            
            const registeredUsers = get().registeredUsers;
            const userIndex = registeredUsers.findIndex(u => u.id === currentUser.id);
            
            if (userIndex >= 0) {
              registeredUsers[userIndex] = updatedUser;
              set({ 
                user: updatedUser,
                registeredUsers: [...registeredUsers]
              });
            } else {
              set({ user: updatedUser });
            }
          }
        }
      },
      addExp: (amount) => {
        const currentUser = get().user;
        if (currentUser) {
          const newExp = (currentUser.exp || 0) + amount;
          const newLevel = calculateLevel(newExp);
          const leveledUp = newLevel > (currentUser.level || 1);
          
          const updatedUser = {
            ...currentUser,
            exp: newExp,
            level: newLevel
          };
          
          const registeredUsers = get().registeredUsers;
          const userIndex = registeredUsers.findIndex(u => u.id === currentUser.id);
          
          if (userIndex >= 0) {
            registeredUsers[userIndex] = updatedUser;
            set({ 
              user: updatedUser,
              registeredUsers: [...registeredUsers]
            });
          } else {
            set({ user: updatedUser });
          }
          
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
        
        return [currentUser, ...MOCK_USERS];
      },
      findUserByEmail: (email) => {
        const registeredUsers = get().registeredUsers;
        return registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
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
