import { Pellet } from '@/types';
import * as Crypto from 'expo-crypto';

/**
 * Creates a deterministic but irreversible hash from a license plate
 * @param licensePlate The license plate to hash
 * @returns A consistent anonymous identifier
 */
export function hashLicensePlate(licensePlate: string): string {
  if (!licensePlate) return 'Unknown';
  
  let hash = 0;
  for (let i = 0; i < licensePlate.length; i++) {
    const char = licensePlate.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const alphanumeric = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
  return `Driver #${alphanumeric}`;
}

/**
 * Hash a password using SHA256
 * @param password The password to hash
 * @returns A hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return hash;
}

/**
 * Calculate aggregate statistics from pellet data
 */
export function calculateStatistics(pellets: Pellet[]) {
  if (!pellets.length) return null;
  
  const now = Date.now();
  const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
  
  const recentPellets = pellets.filter(p => p.createdAt >= oneMonthAgo);
  const previousPellets = pellets.filter(p => p.createdAt < oneMonthAgo && p.createdAt >= (oneMonthAgo - (30 * 24 * 60 * 60 * 1000)));
  
  const negativeCount = recentPellets.filter(p => p.type === 'negative').length;
  const positiveCount = recentPellets.filter(p => p.type === 'positive').length;
  const previousNegativeCount = previousPellets.filter(p => p.type === 'negative').length;
  const previousPositiveCount = previousPellets.filter(p => p.type === 'positive').length;
  
  const totalRecent = negativeCount + positiveCount;
  const totalPrevious = previousNegativeCount + previousPositiveCount;
  
  const positivePercentage = totalRecent ? Math.round((positiveCount / totalRecent) * 100) : 0;
  const negativePercentage = totalRecent ? Math.round((negativeCount / totalRecent) * 100) : 0;
  
  let positiveChange = 0;
  let negativeChange = 0;
  
  if (previousPositiveCount > 0) {
    positiveChange = Math.round(((positiveCount - previousPositiveCount) / previousPositiveCount) * 100);
  } else if (positiveCount > 0) {
    positiveChange = 100;
  }
  
  if (previousNegativeCount > 0) {
    negativeChange = Math.round(((negativeCount - previousNegativeCount) / previousNegativeCount) * 100);
  } else if (negativeCount > 0) {
    negativeChange = 100;
  }
  
  const reasonCounts: Record<string, number> = {};
  recentPellets.forEach(pellet => {
    reasonCounts[pellet.reason] = (reasonCounts[pellet.reason] || 0) + 1;
  });
  
  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([reason, count]) => ({ reason, count }));
  
  return {
    totalRecent,
    totalPrevious,
    positivePercentage,
    negativePercentage,
    positiveChange,
    negativeChange,
    topReasons,
  };
}
