import { getDatabase } from '../database';
import { Pellet } from '@/types';

export const createPellet = async (pellet: Pellet): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync(
    `INSERT INTO pellets (id, target_license_plate, created_by, created_at, reason, type, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pellet.id,
      pellet.targetLicensePlate,
      pellet.createdBy,
      pellet.createdAt,
      pellet.reason,
      pellet.type,
      pellet.location?.latitude || null,
      pellet.location?.longitude || null,
    ]
  );
};

export const getPelletById = async (pelletId: string): Promise<Pellet | null> => {
  const db = await getDatabase();
  
  const row = await db.getFirstAsync<{
    id: string;
    target_license_plate: string;
    created_by: string;
    created_at: number;
    reason: string;
    type: 'negative' | 'positive';
    latitude: number | null;
    longitude: number | null;
  }>('SELECT * FROM pellets WHERE id = ?', [pelletId]);
  
  if (!row) {
    return null;
  }
  
  return {
    id: row.id,
    targetLicensePlate: row.target_license_plate,
    createdBy: row.created_by,
    createdAt: row.created_at,
    reason: row.reason,
    type: row.type,
    location: row.latitude && row.longitude ? {
      latitude: row.latitude,
      longitude: row.longitude,
    } : undefined,
  };
};

export const getAllPellets = async (): Promise<Pellet[]> => {
  const db = await getDatabase();
  
  const rows = await db.getAllAsync<{
    id: string;
    target_license_plate: string;
    created_by: string;
    created_at: number;
    reason: string;
    type: 'negative' | 'positive';
    latitude: number | null;
    longitude: number | null;
  }>('SELECT * FROM pellets ORDER BY created_at DESC');
  
  return rows.map(row => ({
    id: row.id,
    targetLicensePlate: row.target_license_plate,
    createdBy: row.created_by,
    createdAt: row.created_at,
    reason: row.reason,
    type: row.type,
    location: row.latitude && row.longitude ? {
      latitude: row.latitude,
      longitude: row.longitude,
    } : undefined,
  }));
};

export const getPelletsByLicensePlate = async (licensePlate: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = await getDatabase();
  
  let query = 'SELECT * FROM pellets WHERE LOWER(target_license_plate) = LOWER(?)';
  const params: any[] = [licensePlate];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const rows = await db.getAllAsync<{
    id: string;
    target_license_plate: string;
    created_by: string;
    created_at: number;
    reason: string;
    type: 'negative' | 'positive';
    latitude: number | null;
    longitude: number | null;
  }>(query, params);
  
  return rows.map(row => ({
    id: row.id,
    targetLicensePlate: row.target_license_plate,
    createdBy: row.created_by,
    createdAt: row.created_at,
    reason: row.reason,
    type: row.type,
    location: row.latitude && row.longitude ? {
      latitude: row.latitude,
      longitude: row.longitude,
    } : undefined,
  }));
};

export const getPelletsCreatedByUser = async (userId: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = await getDatabase();
  
  let query = 'SELECT * FROM pellets WHERE created_by = ?';
  const params: any[] = [userId];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const rows = await db.getAllAsync<{
    id: string;
    target_license_plate: string;
    created_by: string;
    created_at: number;
    reason: string;
    type: 'negative' | 'positive';
    latitude: number | null;
    longitude: number | null;
  }>(query, params);
  
  return rows.map(row => ({
    id: row.id,
    targetLicensePlate: row.target_license_plate,
    createdBy: row.created_by,
    createdAt: row.created_at,
    reason: row.reason,
    type: row.type,
    location: row.latitude && row.longitude ? {
      latitude: row.latitude,
      longitude: row.longitude,
    } : undefined,
  }));
};

export const deletePellet = async (pelletId: string): Promise<void> => {
  const db = await getDatabase();
  
  await db.runAsync('DELETE FROM pellets WHERE id = ?', [pelletId]);
};
