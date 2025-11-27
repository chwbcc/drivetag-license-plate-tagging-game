export interface User {
  id: string;
  email: string;
  password?: string; // User password (hashed in production)
  licensePlate: string;
  state?: string;
  name?: string;
  photo?: string;
  pelletCount: number; // Number of pellets the user has available
  positivePelletCount: number; // Number of positive pellets the user has available
  badges: string[]; // IDs of badges earned by the user
  exp: number; // Experience points earned by the user
  level: number; // User level based on experience
}

export interface Pellet {
  id: string;
  targetLicensePlate: string;
  createdBy: string;
  createdAt: number;
  reason: string;
  type: 'negative' | 'positive'; // Type of pellet
  location?: {
    latitude: number;
    longitude: number;
  };
}

export type AuthState = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

export type PelletState = {
  pellets: Pellet[];
  isLoading: boolean;
  error: string | null;
};

export interface PaymentItem {
  id: string;
  name: string;
  description: string;
  price: number;
  pelletCount?: number;
  pelletType?: 'negative' | 'positive';
  type: 'purchase' | 'erase' | 'donation';
}

export type PaymentState = {
  items: PaymentItem[];
  purchaseHistory: {
    id: string;
    itemId: string;
    userId: string;
    amount: number;
    date: number;
    status: 'completed' | 'pending' | 'failed';
  }[];
  isLoading: boolean;
  error: string | null;
};

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  criteria: {
    type: 'negative_pellets_received' | 'positive_pellets_received' | 'pellets_given' | 'positive_pellets_given' | 'exp_earned';
    threshold: number;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export type BadgeState = {
  badges: Badge[];
  isLoading: boolean;
  error: string | null;
};