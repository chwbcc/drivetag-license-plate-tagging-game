import { Platform } from 'react-native';
import Purchases, {
  PurchasesOfferings,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';

function getRCApiKey(): string | undefined {
  if (Platform.OS === 'web') {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

let isConfigured = false;

export function configureRevenueCat() {
  if (isConfigured) return;
  const apiKey = getRCApiKey();
  if (!apiKey) {
    console.warn('[RevenueCat] No API key found for platform:', Platform.OS);
    return;
  }
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({ apiKey });
    isConfigured = true;
    console.log('[RevenueCat] Configured successfully for platform:', Platform.OS);
  } catch (error) {
    console.error('[RevenueCat] Configuration error:', error);
  }
}

export async function loginRevenueCat(userId: string): Promise<void> {
  if (!isConfigured) {
    console.warn('[RevenueCat] Not configured, skipping login');
    return;
  }
  try {
    await Purchases.logIn(userId);
    console.log('[RevenueCat] Logged in user:', userId);
  } catch (error) {
    console.error('[RevenueCat] Login error:', error);
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!isConfigured) return;
  try {
    await Purchases.logOut();
    console.log('[RevenueCat] Logged out');
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
  }
}

export async function fetchOfferings(): Promise<PurchasesOfferings | null> {
  if (!isConfigured) {
    console.warn('[RevenueCat] Not configured, returning null offerings');
    return null;
  }
  try {
    const offerings = await Purchases.getOfferings();
    console.log('[RevenueCat] Fetched offerings:', JSON.stringify(offerings?.current?.availablePackages?.length ?? 0), 'packages');
    return offerings;
  } catch (error) {
    console.error('[RevenueCat] Error fetching offerings:', error);
    return null;
  }
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
  if (!isConfigured) {
    throw new Error('RevenueCat is not configured');
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log('[RevenueCat] Purchase successful for:', pkg.identifier);
    return { success: true, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('[RevenueCat] User cancelled purchase');
      return { success: false };
    }
    console.error('[RevenueCat] Purchase error:', error);
    throw error;
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isConfigured) {
    console.warn('[RevenueCat] Not configured, cannot restore');
    return null;
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('[RevenueCat] Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Restore error:', error);
    throw error;
  }
}

export function isRevenueCatConfigured(): boolean {
  return isConfigured;
}

export type ShopItemCategory = 'purchase_neg' | 'purchase_pos' | 'erase' | 'donation';

export function categorizePackage(identifier: string): ShopItemCategory {
  if (identifier.startsWith('pellet_neg')) return 'purchase_neg';
  if (identifier.startsWith('pellet_pos')) return 'purchase_pos';
  if (identifier.startsWith('erase')) return 'erase';
  return 'donation';
}

export function getPelletCountFromIdentifier(identifier: string): number {
  const match = identifier.match(/(\d+)$/);
  if (match) return parseInt(match[1], 10);
  return 0;
}
