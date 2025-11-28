import { getDatabase } from '../database';
import { Pellet } from '@/types';

export const createPellet = async (pellet: Pellet, targetUserId?: string): Promise<void> => {
  const db = getDatabase();
  
  await db.execute({
    sql: 'INSERT INTO pellets (id, targetLicensePlate, targetUserId, createdBy, createdAt, reason, type, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      pellet.id,
      pellet.targetLicensePlate,
      targetUserId || null,
      pellet.createdBy,
      pellet.createdAt,
      pellet.reason,
      pellet.type,
      pellet.location?.latitude || null,
      pellet.location?.longitude || null
    ]
  });
  
  console.log('[PelletService] Created pellet:', pellet.id);
};

export const getPelletById = async (pelletId: string): Promise<Pellet | null> => {
  const db = getDatabase();
  
  const result = await db.execute({
    sql: 'SELECT * FROM pellets WHERE id = ?',
    args: [pelletId]
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  
  return {
    id: row.id as string,
    targetLicensePlate: row.targetLicensePlate as string,
    targetUserId: row.targetUserId as string | undefined,
    createdBy: row.createdBy as string,
    createdAt: row.createdAt as number,
    reason: row.reason as string,
    type: row.type as 'negative' | 'positive',
    location: row.latitude && row.longitude ? {
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    } : undefined,
  };
};

export const getAllPellets = async (): Promise<Pellet[]> => {
  const db = getDatabase();
  
  const result = await db.execute('SELECT * FROM pellets ORDER BY createdAt DESC');
  
  const pellets: Pellet[] = result.rows.map(row => ({
    id: row.id as string,
    targetLicensePlate: row.targetLicensePlate as string,
    targetUserId: row.targetUserId as string | undefined,
    createdBy: row.createdBy as string,
    createdAt: row.createdAt as number,
    reason: row.reason as string,
    type: row.type as 'negative' | 'positive',
    location: row.latitude && row.longitude ? {
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    } : undefined,
  }));
  
  return pellets;
};

export const getPelletsByLicensePlate = async (licensePlate: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = getDatabase();
  
  const normalizedPlate = licensePlate.toLowerCase();
  
  let sql = 'SELECT * FROM pellets WHERE LOWER(targetLicensePlate) = ?';
  const args: any[] = [normalizedPlate];
  
  if (type) {
    sql += ' AND type = ?';
    args.push(type);
  }
  
  sql += ' ORDER BY createdAt DESC';
  
  const result = await db.execute({ sql, args });
  
  const pellets: Pellet[] = result.rows.map(row => ({
    id: row.id as string,
    targetLicensePlate: row.targetLicensePlate as string,
    targetUserId: row.targetUserId as string | undefined,
    createdBy: row.createdBy as string,
    createdAt: row.createdAt as number,
    reason: row.reason as string,
    type: row.type as 'negative' | 'positive',
    location: row.latitude && row.longitude ? {
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    } : undefined,
  }));
  
  return pellets;
};

export const getPelletsCreatedByUser = async (userId: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = getDatabase();
  
  let sql = 'SELECT * FROM pellets WHERE createdBy = ?';
  const args: any[] = [userId];
  
  if (type) {
    sql += ' AND type = ?';
    args.push(type);
  }
  
  sql += ' ORDER BY createdAt DESC';
  
  const result = await db.execute({ sql, args });
  
  const pellets: Pellet[] = result.rows.map(row => ({
    id: row.id as string,
    targetLicensePlate: row.targetLicensePlate as string,
    targetUserId: row.targetUserId as string | undefined,
    createdBy: row.createdBy as string,
    createdAt: row.createdAt as number,
    reason: row.reason as string,
    type: row.type as 'negative' | 'positive',
    location: row.latitude && row.longitude ? {
      latitude: row.latitude as number,
      longitude: row.longitude as number,
    } : undefined,
  }));
  
  return pellets;
};

export const deletePellet = async (pelletId: string): Promise<void> => {
  const db = getDatabase();
  
  await db.execute({
    sql: 'DELETE FROM pellets WHERE id = ?',
    args: [pelletId]
  });
  
  console.log('[PelletService] Deleted pellet:', pelletId);
};
