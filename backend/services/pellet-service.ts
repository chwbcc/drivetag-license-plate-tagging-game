import { getDatabase } from '../database';
import { Pellet } from '@/types';

export const createPellet = async (pellet: Pellet): Promise<void> => {
  const db = getDatabase();
  
  const dbPellet = {
    id: pellet.id,
    targetLicensePlate: pellet.targetLicensePlate,
    createdBy: pellet.createdBy,
    createdAt: pellet.createdAt,
    reason: pellet.reason,
    type: pellet.type,
    latitude: pellet.location?.latitude,
    longitude: pellet.location?.longitude,
  };
  
  db.pellets.set(pellet.id, dbPellet);
  
  console.log('[PelletService] Created pellet:', pellet.id);
};

export const getPelletById = async (pelletId: string): Promise<Pellet | null> => {
  const db = getDatabase();
  
  const dbPellet = db.pellets.get(pelletId);
  
  if (!dbPellet) {
    return null;
  }
  
  return {
    id: dbPellet.id,
    targetLicensePlate: dbPellet.targetLicensePlate,
    createdBy: dbPellet.createdBy,
    createdAt: dbPellet.createdAt,
    reason: dbPellet.reason,
    type: dbPellet.type,
    location: dbPellet.latitude && dbPellet.longitude ? {
      latitude: dbPellet.latitude,
      longitude: dbPellet.longitude,
    } : undefined,
  };
};

export const getAllPellets = async (): Promise<Pellet[]> => {
  const db = getDatabase();
  
  const allPellets = Array.from(db.pellets.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(dbPellet => ({
      id: dbPellet.id,
      targetLicensePlate: dbPellet.targetLicensePlate,
      createdBy: dbPellet.createdBy,
      createdAt: dbPellet.createdAt,
      reason: dbPellet.reason,
      type: dbPellet.type,
      location: dbPellet.latitude && dbPellet.longitude ? {
        latitude: dbPellet.latitude,
        longitude: dbPellet.longitude,
      } : undefined,
    }));
  
  return allPellets;
};

export const getPelletsByLicensePlate = async (licensePlate: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = getDatabase();
  
  const normalizedPlate = licensePlate.toLowerCase();
  
  const filtered = Array.from(db.pellets.values())
    .filter(dbPellet => {
      const matches = dbPellet.targetLicensePlate.toLowerCase() === normalizedPlate;
      if (type) {
        return matches && dbPellet.type === type;
      }
      return matches;
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(dbPellet => ({
      id: dbPellet.id,
      targetLicensePlate: dbPellet.targetLicensePlate,
      createdBy: dbPellet.createdBy,
      createdAt: dbPellet.createdAt,
      reason: dbPellet.reason,
      type: dbPellet.type,
      location: dbPellet.latitude && dbPellet.longitude ? {
        latitude: dbPellet.latitude,
        longitude: dbPellet.longitude,
      } : undefined,
    }));
  
  return filtered;
};

export const getPelletsCreatedByUser = async (userId: string, type?: 'negative' | 'positive'): Promise<Pellet[]> => {
  const db = getDatabase();
  
  const filtered = Array.from(db.pellets.values())
    .filter(dbPellet => {
      const matches = dbPellet.createdBy === userId;
      if (type) {
        return matches && dbPellet.type === type;
      }
      return matches;
    })
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(dbPellet => ({
      id: dbPellet.id,
      targetLicensePlate: dbPellet.targetLicensePlate,
      createdBy: dbPellet.createdBy,
      createdAt: dbPellet.createdAt,
      reason: dbPellet.reason,
      type: dbPellet.type,
      location: dbPellet.latitude && dbPellet.longitude ? {
        latitude: dbPellet.latitude,
        longitude: dbPellet.longitude,
      } : undefined,
    }));
  
  return filtered;
};

export const deletePellet = async (pelletId: string): Promise<void> => {
  const db = getDatabase();
  
  db.pellets.delete(pelletId);
  
  console.log('[PelletService] Deleted pellet:', pelletId);
};
