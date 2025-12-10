import { getDatabase } from '../database';
import { Pellet } from '@/types';
import { getUserByLicensePlate } from './user-service';

export const createPellet = async (pellet: Pellet): Promise<void> => {
  try {
    const db = getDatabase();
    
    console.log('[PelletService] Creating pellet with data:', {
      id: pellet.id,
      targetLicensePlate: pellet.targetLicensePlate,
      createdBy: pellet.createdBy,
      type: pellet.type,
    });
    
    let targetUserId: string | null = null;
    try {
      const targetUser = await getUserByLicensePlate(pellet.targetLicensePlate);
      if (targetUser) {
        targetUserId = targetUser.id;
        console.log('[PelletService] Found target user:', targetUserId);
      } else {
        console.log('[PelletService] No user found with license plate:', pellet.targetLicensePlate);
      }
    } catch (error) {
      console.log('[PelletService] Could not find user by license plate:', error);
    }
    
    const { error } = await db
      .from('pellets')
      .insert({
        id: pellet.id,
        targetLicensePlate: pellet.targetLicensePlate,
        targetUserId,
        createdBy: pellet.createdBy,
        createdAt: pellet.createdAt,
        reason: pellet.reason,
        type: pellet.type,
        latitude: pellet.location?.latitude || null,
        longitude: pellet.location?.longitude || null,
      });
    
    if (error) throw error;
    
    console.log('[PelletService] Created pellet successfully:', pellet.id);
  } catch (error: any) {
    console.error('[PelletService] Error creating pellet:', error);
    console.error('[PelletService] Error details:', {
      message: error?.message,
      code: error?.code,
    });
    throw error;
  }
};

export const getPelletById = async (pelletId: string): Promise<Pellet | null> => {
  const db = getDatabase();
  
  const { data, error } = await db
    .from('pellets')
    .select('*')
    .eq('id', pelletId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    id: data.id as string,
    targetLicensePlate: data.targetLicensePlate as string,
    targetUserId: data.targetUserId as string | undefined,
    createdBy: data.createdBy as string,
    createdAt: data.createdAt as number,
    reason: data.reason as string,
    type: data.type as 'negative' | 'positive',
    location: data.latitude && data.longitude ? {
      latitude: data.latitude as number,
      longitude: data.longitude as number,
    } : undefined,
  };
};

export const getAllPellets = async (): Promise<Pellet[]> => {
  const db = getDatabase();
  
  const { data, error } = await db
    .from('pellets')
    .select('*')
    .order('createdAt', { ascending: false });
  
  if (error) throw error;
  
  const pellets: Pellet[] = (data || []).map((row: any) => ({
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
  
  let query = db
    .from('pellets')
    .select('*')
    .ilike('targetLicensePlate', normalizedPlate);
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query.order('createdAt', { ascending: false });
  
  if (error) throw error;
  
  const pellets: Pellet[] = (data || []).map((row: any) => ({
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
  
  let query = db
    .from('pellets')
    .select('*')
    .eq('createdBy', userId);
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query.order('createdAt', { ascending: false });
  
  if (error) throw error;
  
  const pellets: Pellet[] = (data || []).map((row: any) => ({
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
  
  const { error } = await db
    .from('pellets')
    .delete()
    .eq('id', pelletId);
  
  if (error) throw error;
  
  console.log('[PelletService] Deleted pellet:', pelletId);
};
