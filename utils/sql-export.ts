import { User, Pellet, Badge, PaymentItem } from '@/types';
import useAuthStore from '@/store/auth-store';
import usePelletStore from '@/store/pellet-store';
import useBadgeStore from '@/store/badge-store';
import usePaymentStore from '@/store/payment-store';

export interface SQLExportResult {
  schema: string;
  data: string;
  fullExport: string;
}

/**
 * Generate SQL CREATE TABLE statements for the app's data structure
 */
export function generateSQLSchema(): string {
  const schema = `
-- Stupid Pellets App Database Schema
-- Generated on ${new Date().toISOString()}

-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  license_plate VARCHAR(20) NOT NULL,
  state VARCHAR(2),
  photo TEXT,
  pellet_count INTEGER DEFAULT 0,
  positive_pellet_count INTEGER DEFAULT 0,
  exp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges TEXT, -- JSON array of badge IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pellets table
CREATE TABLE pellets (
  id VARCHAR(255) PRIMARY KEY,
  target_license_plate VARCHAR(20) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at BIGINT NOT NULL,
  reason TEXT NOT NULL,
  type ENUM('negative', 'positive') NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_target_plate (target_license_plate),
  INDEX idx_created_by (created_by),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
);

-- Badges table
CREATE TABLE badges (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  criteria_type VARCHAR(50) NOT NULL,
  criteria_threshold INTEGER NOT NULL,
  rarity ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment items table
CREATE TABLE payment_items (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  pellet_count INTEGER,
  pellet_type ENUM('negative', 'positive'),
  type ENUM('purchase', 'erase', 'donation') NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase history table
CREATE TABLE purchase_history (
  id VARCHAR(255) PRIMARY KEY,
  item_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date BIGINT NOT NULL,
  status ENUM('completed', 'pending', 'failed') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES payment_items(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_date (date)
);

-- User badges junction table
CREATE TABLE user_badges (
  user_id VARCHAR(255) NOT NULL,
  badge_id VARCHAR(255) NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_users_license_plate ON users(license_plate);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_users_exp ON users(exp);
CREATE INDEX idx_pellets_location ON pellets(latitude, longitude);
`;

  return schema.trim();
}

/**
 * Convert a user object to SQL INSERT statement
 */
function userToSQL(user: User): string {
  const badges = JSON.stringify(user.badges || []);
  return `INSERT INTO users (id, email, name, license_plate, state, photo, pellet_count, positive_pellet_count, exp, level, badges) VALUES (
    '${user.id}',
    '${user.email.replace(/'/g, "''")}',
    ${user.name ? `'${user.name.replace(/'/g, "''")}'` : 'NULL'},
    '${user.licensePlate}',
    ${user.state ? `'${user.state}'` : 'NULL'},
    ${user.photo ? `'${user.photo.replace(/'/g, "''")}'` : 'NULL'},
    ${user.pelletCount},
    ${user.positivePelletCount || 0},
    ${user.exp || 0},
    ${user.level || 1},
    '${badges.replace(/'/g, "''")}'
  );`;
}

/**
 * Convert a pellet object to SQL INSERT statement
 */
function pelletToSQL(pellet: Pellet): string {
  return `INSERT INTO pellets (id, target_license_plate, created_by, created_at, reason, type, latitude, longitude) VALUES (
    '${pellet.id}',
    '${pellet.targetLicensePlate}',
    '${pellet.createdBy}',
    ${pellet.createdAt},
    '${pellet.reason.replace(/'/g, "''")}',
    '${pellet.type}',
    ${pellet.location?.latitude || 'NULL'},
    ${pellet.location?.longitude || 'NULL'}
  );`;
}

/**
 * Convert a badge object to SQL INSERT statement
 */
function badgeToSQL(badge: Badge): string {
  return `INSERT INTO badges (id, name, description, icon, criteria_type, criteria_threshold, rarity) VALUES (
    '${badge.id}',
    '${badge.name.replace(/'/g, "''")}',
    '${badge.description.replace(/'/g, "''")}',
    '${badge.icon}',
    '${badge.criteria.type}',
    ${badge.criteria.threshold},
    '${badge.rarity}'
  );`;
}

/**
 * Convert a payment item to SQL INSERT statement
 */
function paymentItemToSQL(item: PaymentItem): string {
  return `INSERT INTO payment_items (id, name, description, price, pellet_count, pellet_type, type) VALUES (
    '${item.id}',
    '${item.name.replace(/'/g, "''")}',
    '${item.description.replace(/'/g, "''")}',
    ${item.price},
    ${item.pelletCount || 'NULL'},
    ${item.pelletType ? `'${item.pelletType}'` : 'NULL'},
    '${item.type}'
  );`;
}

/**
 * Generate user badges junction table inserts
 */
function generateUserBadgesSQL(users: User[]): string {
  const inserts: string[] = [];
  
  users.forEach(user => {
    if (user.badges && user.badges.length > 0) {
      user.badges.forEach(badgeId => {
        inserts.push(`INSERT INTO user_badges (user_id, badge_id) VALUES ('${user.id}', '${badgeId}');`);
      });
    }
  });
  
  return inserts.join('\n');
}

/**
 * Generate purchase history SQL inserts
 */
function generatePurchaseHistorySQL(purchaseHistory: any[]): string {
  return purchaseHistory.map(purchase => 
    `INSERT INTO purchase_history (id, item_id, user_id, amount, date, status) VALUES (
      '${purchase.id}',
      '${purchase.itemId}',
      '${purchase.userId}',
      ${purchase.amount},
      ${purchase.date},
      '${purchase.status}'
    );`
  ).join('\n');
}

/**
 * Export all current app data to SQL INSERT statements
 */
export function exportDataToSQL(): string {
  const authStore = useAuthStore.getState();
  const pelletStore = usePelletStore.getState();
  const badgeStore = useBadgeStore.getState();
  const paymentStore = usePaymentStore.getState();
  
  const allUsers = authStore.getAllUsers();
  const currentUser = authStore.user;
  
  // Combine current user with mock users, avoiding duplicates
  const users = currentUser 
    ? [currentUser, ...allUsers.filter(u => u.id !== currentUser.id)]
    : allUsers;
  
  const dataExport = `
-- Stupid Pellets App Data Export
-- Generated on ${new Date().toISOString()}

-- Disable foreign key checks for import
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data
TRUNCATE TABLE user_badges;
TRUNCATE TABLE purchase_history;
TRUNCATE TABLE pellets;
TRUNCATE TABLE payment_items;
TRUNCATE TABLE badges;
TRUNCATE TABLE users;

-- Insert badges
${badgeStore.badges.map(badgeToSQL).join('\n')}

-- Insert payment items
${paymentStore.items.map(paymentItemToSQL).join('\n')}

-- Insert users
${users.map(userToSQL).join('\n')}

-- Insert pellets
${pelletStore.pellets.map(pelletToSQL).join('\n')}

-- Insert user badges
${generateUserBadgesSQL(users)}

-- Insert purchase history
${generatePurchaseHistorySQL(paymentStore.purchaseHistory)}

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
`;

  return dataExport.trim();
}

/**
 * Generate complete SQL export (schema + data)
 */
export function generateFullSQLExport(): SQLExportResult {
  const schema = generateSQLSchema();
  const data = exportDataToSQL();
  const fullExport = `${schema}\n\n${data}`;
  
  return {
    schema,
    data,
    fullExport
  };
}

/**
 * Download SQL file (web only)
 */
export function downloadSQLFile(content: string, filename: string = 'stupid-pellets-export.sql'): void {
  if (typeof window === 'undefined') {
    console.log('Download not available on mobile. SQL content:', content);
    return;
  }
  
  const blob = new Blob([content], { type: 'text/sql' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy SQL to clipboard
 */
export async function copySQLToClipboard(content: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(content);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  const authStore = useAuthStore.getState();
  const pelletStore = usePelletStore.getState();
  const badgeStore = useBadgeStore.getState();
  const paymentStore = usePaymentStore.getState();
  
  const allUsers = authStore.getAllUsers();
  const currentUser = authStore.user;
  const users = currentUser 
    ? [currentUser, ...allUsers.filter(u => u.id !== currentUser.id)]
    : allUsers;
  
  return {
    users: users.length,
    pellets: pelletStore.pellets.length,
    badges: badgeStore.badges.length,
    paymentItems: paymentStore.items.length,
    purchases: paymentStore.purchaseHistory.length,
    negativePellets: pelletStore.pellets.filter(p => p.type === 'negative').length,
    positivePellets: pelletStore.pellets.filter(p => p.type === 'positive').length,
  };
}