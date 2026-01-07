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
        license_plate: pellet.targetLicensePlate,
        targetuserid: targetUserId,
        createdby: pellet.createdBy,
        created_at: pellet.createdAt,
        notes: pellet.reason,
        type: pellet.type,
        latitude: pellet.location?.latitude || null,
        longitude: pellet.location?.longitude || null,
      });
    
    if (error) throw error;
    
    console.log('[PelletService] Created pellet successfully:', pellet.id);
    
    if (targetUserId) {
      const ratingColumn = pellet.type === 'positive' ? 'positive_rating_count' : 'negative_rating_count';
      const { error: updateError } = await db.rpc('increment', {
        table_name: 'users',
        row_id: targetUserId,
        column_name: ratingColumn
      });
      
      if (updateError) {
        console.warn('[PelletService] Could not update rating count:', updateError);
        
        const { data: userData } = await db
          .from('users')
          .select(ratingColumn)
          .eq('id', targetUserId)
          .single();
        
        if (userData) {
          const currentValue = (userData as any)[ratingColumn] || 0;
          await db
            .from('users')
            .update({ [ratingColumn]: currentValue + 1 })
            .eq('id', targetUserId);
        }
      }
    }
    
    const pelletsGivenColumn = pellet.type === 'positive' ? 'positive_pellets_given_count' : 'negative_pellets_given_count';
    const { error: giverUpdateError } = await db.rpc('increment', {
      table_name: 'users',
      row_id: pellet.createdBy,
      column_name: pelletsGivenColumn
    });
    
    if (giverUpdateError) {
      console.warn(`[PelletService] Could not update ${pelletsGivenColumn}:`, giverUpdateError);
      
      const { data: giverData } = await db
        .from('users')
        .select(`pellets_given_count, ${pelletsGivenColumn}`)
        .eq('id', pellet.createdBy)
        .single();
      
      if (giverData) {
        const currentTypeCount = (giverData as any)[pelletsGivenColumn] || 0;
        const currentTotalCount = giverData.pellets_given_count || 0;
        await db
          .from('users')
          .update({ 
            [pelletsGivenColumn]: currentTypeCount + 1,
            pellets_given_count: currentTotalCount + 1
          })
          .eq('id', pellet.createdBy);
      }
    } else {
      await db.rpc('increment', {
        table_name: 'users',
        row_id: pellet.createdBy,
        column_name: 'pellets_given_count'
      });
    }
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
    targetLicensePlate: data.license_plate as string,
    targetUserId: data.targetuserid as string | undefined,
    createdBy: data.createdby as string,
    createdAt: data.created_at as number,
    reason: data.notes as string,
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
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  const pellets: Pellet[] = (data || []).map((row: any) => ({
    id: row.id as string,
    targetLicensePlate: row.license_plate as string,
    targetUserId: row.targetuserid as string | undefined,
    createdBy: row.createdby as string,
    createdAt: row.created_at as number,
    reason: row.notes as string,
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
    .ilike('license_plate', normalizedPlate);
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  
  const pellets: Pellet[] = (data || []).map((row: any) => ({
    id: row.id as string,
    targetLicensePlate: row.license_plate as string,
    targetUserId: row.targetuserid as string | undefined,
    createdBy: row.createdby as string,
    createdAt: row.created_at as number,
    reason: row.notes as string,
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
    .eq('createdby', userId);
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  
  const pellets: Pellet[] = (data || []).map((row: any) => ({
    id: row.id as string,
    targetLicensePlate: row.license_plate as string,
    targetUserId: row.targetuserid as string | undefined,
    createdBy: row.createdby as string,
    createdAt: row.created_at as number,
    reason: row.notes as string,
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
