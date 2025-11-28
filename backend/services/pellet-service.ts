import { getDatabase, DBPellet } from '../database';
import { Pellet } from '@/types';

export const createPellet = async (pellet: Pellet): Promise<void> => {
  const db = await getDatabase();
  
  const dbPellet: DBPellet = {
    id: pellet.id,
    target_license_plate: pellet.targetLicensePlate,
    created_by: pellet.createdBy,
    created_at: pellet.createdAt,
    reason: pellet.reason,
    type: pellet.type,
    latitude: pellet.location?.latitude || null,
    longitude: pellet.location?.longitude || null,
  };
  
  db.pellets.push(dbPellet);
};

export const getPelletById = async (pelletId: string): Promise<Pellet | null> => {
  const db = await getDatabase();
  
  const row = db.pellets.find(p => p.id === pelletId);
  
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
  
  const rows = [...db.pellets].sort((a, b) => b.created_at - a.created_at);
  
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
  
  let rows = db.pellets.filter(p => 
    p.target_license_plate.toLowerCase() === licensePlate.toLowerCase()
  );
  
  if (type) {
    rows = rows.filter(p => p.type === type);
  }
  
  rows.sort((a, b) => b.created_at - a.created_at);
  
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
  
  let rows = db.pellets.filter(p => p.created_by === userId);
  
  if (type) {
    rows = rows.filter(p => p.type === type);
  }
  
  rows.sort((a, b) => b.created_at - a.created_at);
  
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
  
  const index = db.pellets.findIndex(p => p.id === pelletId);
  
  if (index !== -1) {
    db.pellets.splice(index, 1);
  }
};
