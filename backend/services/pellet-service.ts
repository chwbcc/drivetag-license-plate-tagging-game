import { getDatabase, type DBPellet } from '../database';
import { Pellet } from '@/types';

export const createPellet = async (pellet: Pellet): Promise<void> => {
  const db = getDatabase();
  
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
  const db = getDatabase();
  
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
  const db = getDatabase();
  
  return db.pellets
    .map(r => ({
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
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getPelletsByLicensePlate = async (licensePlate: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = getDatabase();
  
  let filtered = db.pellets.filter(p => 
    p.target_license_plate.toLowerCase() === licensePlate.toLowerCase()
  );
  
  if (type) {
    filtered = filtered.filter(p => p.type === type);
  }
  
  return filtered
    .map(r => ({
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
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const getPelletsCreatedByUser = async (userId: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = getDatabase();
  
  let filtered = db.pellets.filter(p => p.created_by === userId);
  
  if (type) {
    filtered = filtered.filter(p => p.type === type);
  }
  
  return filtered
    .map(r => ({
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
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
};

export const deletePellet = async (pelletId: string): Promise<void> => {
  const db = getDatabase();
  
  const index = db.pellets.findIndex(p => p.id === pelletId);
  
  if (index !== -1) {
    db.pellets.splice(index, 1);
  }
};
