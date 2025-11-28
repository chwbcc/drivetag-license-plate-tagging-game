import { getDatabase, type DBPellet } from '../database';
import { Pellet } from '@/types';

export const createPellet = async (pellet: Pellet): Promise<void> => {
  const db = getDatabase();
  
  await db.execute({
    sql: `
      INSERT INTO pellets (
        id, target_license_plate, created_by, created_at, reason, type, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      pellet.id,
      pellet.targetLicensePlate,
      pellet.createdBy,
      pellet.createdAt,
      pellet.reason,
      pellet.type,
      pellet.location?.latitude || null,
      pellet.location?.longitude || null
    ]
  });
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
  
  const row = result.rows[0] as unknown as DBPellet;
  
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
  const db = getDatabase();
  
  const result = await db.execute('SELECT * FROM pellets ORDER BY created_at DESC');
  
  return result.rows.map(row => {
    const r = row as unknown as DBPellet;
    return {
      id: r.id,
      targetLicensePlate: r.target_license_plate,
      createdBy: r.created_by,
      createdAt: r.created_at,
      reason: r.reason,
      type: r.type,
      location: r.latitude && r.longitude ? {
        latitude: r.latitude,
        longitude: r.longitude,
      } : undefined,
    };
  });
};

export const getPelletsByLicensePlate = async (licensePlate: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = getDatabase();
  
  let sql = 'SELECT * FROM pellets WHERE LOWER(target_license_plate) = LOWER(?)';
  const args: any[] = [licensePlate];
  
  if (type) {
    sql += ' AND type = ?';
    args.push(type);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = await db.execute({ sql, args });
  
  return result.rows.map(row => {
    const r = row as unknown as DBPellet;
    return {
      id: r.id,
      targetLicensePlate: r.target_license_plate,
      createdBy: r.created_by,
      createdAt: r.created_at,
      reason: r.reason,
      type: r.type,
      location: r.latitude && r.longitude ? {
        latitude: r.latitude,
        longitude: r.longitude,
      } : undefined,
    };
  });
};

export const getPelletsCreatedByUser = async (userId: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = getDatabase();
  
  let sql = 'SELECT * FROM pellets WHERE created_by = ?';
  const args: any[] = [userId];
  
  if (type) {
    sql += ' AND type = ?';
    args.push(type);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = await db.execute({ sql, args });
  
  return result.rows.map(row => {
    const r = row as unknown as DBPellet;
    return {
      id: r.id,
      targetLicensePlate: r.target_license_plate,
      createdBy: r.created_by,
      createdAt: r.created_at,
      reason: r.reason,
      type: r.type,
      location: r.latitude && r.longitude ? {
        latitude: r.latitude,
        longitude: r.longitude,
      } : undefined,
    };
  });
};

export const deletePellet = async (pelletId: string): Promise<void> => {
  const db = getDatabase();
  
  await db.execute({
    sql: 'DELETE FROM pellets WHERE id = ?',
    args: [pelletId]
  });
};
