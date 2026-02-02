import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { User, AdminRole } from '@/types';
import useAuthStore from '@/store/auth-store';

export const mapDatabaseUserToUser = (data: any): User => {
  return {
    id: data.id as string,
    email: data.email as string,
    name: (data.name as string) || '',
    photo: data.photo as string | undefined,
    licensePlate: (data.license_plate as string) || '',
    state: (data.state as string) || '',
    pelletCount: (data.negative_pellet_count as number) || 0,
    positivePelletCount: (data.positive_pellet_count as number) || 0,
    positiveRatingCount: (data.positive_rating_count as number) || 0,
    negativeRatingCount: (data.negative_rating_count as number) || 0,
    pelletsGivenCount: (data.pellets_given_count as number) || 0,
    negativePelletsGivenCount: (data.negative_pellets_given_count as number) || 0,
    positivePelletsGivenCount: (data.positive_pellets_given_count as number) || 0,
    badges: typeof data.badges === 'string' ? JSON.parse(data.badges) : (data.badges || []),
    exp: (data.experience as number) || 0,
    level: (data.level as number) || 1,
    adminRole: (data.role as AdminRole) || null,
    createdAt: data.created_at ? new Date(data.created_at).toISOString() : undefined,
  };
};

export const useCurrentUser = () => {
  const localUser = useAuthStore((state) => state.user);
  const updateLocalUser = useAuthStore((state) => state.updateUser);
  
  return useQuery({
    queryKey: ['currentUser', localUser?.id],
    queryFn: async () => {
      if (!localUser?.id) {
        console.log('[useCurrentUser] No local user ID');
        return null;
      }
      
      console.log('[useCurrentUser] Fetching user from database:', localUser.id);
      
      let data = null;
      let error = null;
      
      try {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', localUser.id)
          .maybeSingle();
        
        data = result.data;
        error = result.error;
      } catch (fetchError: any) {
        console.warn('[useCurrentUser] Network error, using local data:', fetchError?.message || 'Unknown error');
        return localUser;
      }
      
      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          console.warn('[useCurrentUser] Network error, using local data');
          return localUser;
        }
        console.error('[useCurrentUser] Error fetching user:', JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        }));
        return localUser;
      }
      
      if (!data) {
        console.log('[useCurrentUser] No user found in database, creating user...');
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: localUser.id,
            email: localUser.email,
            name: localUser.name || '',
            photo: localUser.photo,
            license_plate: localUser.licensePlate?.toLowerCase() || '',
            state: localUser.state || '',
            created_at: Date.now(),
            role: localUser.adminRole || 'user',
            experience: localUser.exp || 0,
            level: localUser.level || 1,
            negative_pellet_count: localUser.pelletCount || 10,
            positive_pellet_count: localUser.positivePelletCount || 5,
            positive_rating_count: localUser.positiveRatingCount || 0,
            negative_rating_count: localUser.negativeRatingCount || 0,
            pellets_given_count: localUser.pelletsGivenCount || 0,
            positive_pellets_given_count: localUser.positivePelletsGivenCount || 0,
            negative_pellets_given_count: localUser.negativePelletsGivenCount || 0,
            badges: JSON.stringify(localUser.badges || []),
          }]);
        
        if (insertError) {
          console.error('[useCurrentUser] Error creating user:', JSON.stringify({
            code: insertError.code,
            message: insertError.message,
            details: insertError.details
          }));
          return localUser;
        }
        
        console.log('[useCurrentUser] User created successfully');
        return localUser;
      }
      
      const user = mapDatabaseUserToUser(data);
      console.log('[useCurrentUser] Fetched user:', user.email);
      console.log('[useCurrentUser] Stats - Level:', user.level, 'Exp:', user.exp);
      console.log('[useCurrentUser] Stats - Pellets Given:', user.pelletsGivenCount, 'Positive Given:', user.positivePelletsGivenCount, 'Negative Given:', user.negativePelletsGivenCount);
      console.log('[useCurrentUser] Stats - Positive Received:', user.positiveRatingCount, 'Negative Received:', user.negativeRatingCount);
      
      updateLocalUser(user);
      
      return user;
    },
    enabled: !!localUser?.id,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });
};

export const getUserStats = (user: User | null | undefined) => {
  if (!user) {
    return {
      totalGiven: 0,
      positiveGiven: 0,
      negativeGiven: 0,
      totalReceived: 0,
      positiveReceived: 0,
      negativeReceived: 0,
    };
  }
  
  return {
    totalGiven: user.pelletsGivenCount ?? 0,
    positiveGiven: user.positivePelletsGivenCount ?? 0,
    negativeGiven: user.negativePelletsGivenCount ?? 0,
    totalReceived: (user.positiveRatingCount ?? 0) + (user.negativeRatingCount ?? 0),
    positiveReceived: user.positiveRatingCount ?? 0,
    negativeReceived: user.negativeRatingCount ?? 0,
  };
};

export const useLeaderboardPellets = (sortOrder: 'asc' | 'desc', pelletType: 'negative' | 'positive' | 'all') => {
  return useQuery({
    queryKey: ['leaderboard', 'pellets', sortOrder, pelletType],
    queryFn: async () => {
      console.log('[useLeaderboardPellets] Fetching leaderboard data');
      
      let query = supabase
        .from('pellets')
        .select('*');
      
      if (pelletType !== 'all') {
        query = query.eq('type', pelletType);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[useLeaderboardPellets] Error:', JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details
        }));
        throw error;
      }
      
      const plateMap = new Map<string, number>();
      (data || []).forEach((item: any) => {
        const plate = item.license_plate || item.targetlicenseplate || item.targetLicensePlate;
        if (plate) {
          plateMap.set(plate, (plateMap.get(plate) || 0) + 1);
        }
      });
      
      const aggregated = Array.from(plateMap.entries()).map(([licensePlate, count]) => ({
        licensePlate,
        count,
      }));
      
      aggregated.sort((a, b) => {
        return sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
      });
      
      console.log('[useLeaderboardPellets] Found', aggregated.length, 'entries');
      
      return aggregated;
    },
    staleTime: 30000,
  });
};

export const useLeaderboardExperience = (sortOrder: 'asc' | 'desc') => {
  return useQuery({
    queryKey: ['leaderboard', 'experience', sortOrder],
    queryFn: async () => {
      console.log('[useLeaderboardExperience] Fetching experience leaderboard');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, experience, level')
        .order('experience', { ascending: sortOrder === 'asc' })
        .limit(100);
      
      if (error) {
        console.error('[useLeaderboardExperience] Error:', JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details
        }));
        throw error;
      }
      
      const parsedData = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name || 'Anonymous',
        exp: row.experience || 0,
        level: row.level || 1,
      }));
      
      console.log('[useLeaderboardExperience] Found', parsedData.length, 'users');
      
      return parsedData;
    },
    staleTime: 30000,
  });
};

export const useAllPelletsForStats = () => {
  return useQuery({
    queryKey: ['allPellets', 'stats'],
    queryFn: async () => {
      console.log('[useAllPelletsForStats] Fetching all pellets for statistics');
      
      const { data, error } = await supabase
        .from('pellets')
        .select('*');
      
      if (error) {
        console.error('[useAllPelletsForStats] Error:', JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details
        }));
        throw error;
      }
      
      const pellets = (data || []).map((item: any) => ({
        type: item.type,
        notes: item.notes || item.reason || '',
        created_at: item.created_at || item.createdAt || item.createdat
      }));
      
      return pellets;
    },
    staleTime: 60000,
  });
};

export const useCreatePellet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      licensePlate,
      createdBy,
      createdAt,
      reason,
      type,
      latitude,
      longitude,
    }: {
      id: string;
      licensePlate: string;
      createdBy: string;
      createdAt: number;
      reason: string;
      type: 'positive' | 'negative';
      latitude?: number;
      longitude?: number;
    }) => {
      console.log('[useCreatePellet] Creating pellet:', { id, licensePlate, type, createdBy });
      
      const { data: targetUser } = await supabase
        .from('users')
        .select('id')
        .ilike('license_plate', licensePlate.toLowerCase())
        .single();
      
      const targetUserId = targetUser?.id || null;
      console.log('[useCreatePellet] Target user ID:', targetUserId);
      
      const { error } = await supabase
        .from('pellets')
        .insert([{
          id,
          license_plate: licensePlate.toLowerCase(),
          targetuserid: targetUserId,
          created_by: createdBy,
          created_at: createdAt,
          notes: reason,
          type,
          latitude: latitude || null,
          longitude: longitude || null,
        }]);
      
      if (error) {
        console.error('[useCreatePellet] Error inserting pellet:', JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details
        }));
        throw error;
      }
      
      return { id, licensePlate, type, targetUserId };
    },
    onSuccess: () => {
      console.log('[useCreatePellet] Success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['pellets'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['allPellets'] });
    },
  });
};

export const useUpdateUserAfterTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      userId,
      pelletType,
      expGained,
      newLevel,
    }: {
      userId: string;
      pelletType: 'positive' | 'negative';
      expGained: number;
      newLevel: number;
    }) => {
      console.log('[useUpdateUserAfterTag] Updating user:', userId, pelletType, expGained);
      
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        console.error('[useUpdateUserAfterTag] Error fetching user:', JSON.stringify({
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details
        }));
        throw fetchError;
      }
      
      const pelletColumn = pelletType === 'positive' ? 'positive_pellet_count' : 'negative_pellet_count';
      const givenColumn = pelletType === 'positive' ? 'positive_pellets_given_count' : 'negative_pellets_given_count';
      
      const currentPelletCount = (currentUser[pelletColumn] as number) || 0;
      const currentGivenCount = (currentUser[givenColumn] as number) || 0;
      const currentTotalGiven = (currentUser.pellets_given_count as number) || 0;
      const currentExp = (currentUser.experience as number) || 0;
      
      const updateData = {
        [pelletColumn]: Math.max(0, currentPelletCount - 1),
        [givenColumn]: currentGivenCount + 1,
        pellets_given_count: currentTotalGiven + 1,
        experience: currentExp + expGained,
        level: newLevel,
      };
      
      console.log('[useUpdateUserAfterTag] Update data:', updateData);
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);
      
      if (updateError) {
        console.error('[useUpdateUserAfterTag] Error updating user:', JSON.stringify({
          code: updateError.code,
          message: updateError.message,
          details: updateError.details
        }));
        throw updateError;
      }
      
      return { userId, updateData };
    },
    onSuccess: () => {
      console.log('[useUpdateUserAfterTag] Success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

export const useUpdateTargetUserRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      targetUserId,
      pelletType,
    }: {
      targetUserId: string;
      pelletType: 'positive' | 'negative';
    }) => {
      console.log('[useUpdateTargetUserRating] Updating target:', targetUserId, pelletType);
      
      const ratingColumn = pelletType === 'positive' ? 'positive_rating_count' : 'negative_rating_count';
      
      const { data: targetUser, error: fetchError } = await supabase
        .from('users')
        .select('positive_rating_count, negative_rating_count')
        .eq('id', targetUserId)
        .single();
      
      if (fetchError) {
        console.error('[useUpdateTargetUserRating] Error fetching target:', JSON.stringify({
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details
        }));
        throw fetchError;
      }
      
      const currentCount = pelletType === 'positive' 
        ? ((targetUser?.positive_rating_count as number) || 0)
        : ((targetUser?.negative_rating_count as number) || 0);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ [ratingColumn]: currentCount + 1 })
        .eq('id', targetUserId);
      
      if (updateError) {
        console.error('[useUpdateTargetUserRating] Error updating target:', JSON.stringify({
          code: updateError.code,
          message: updateError.message,
          details: updateError.details
        }));
        throw updateError;
      }
      
      return { targetUserId, pelletType };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

export const useFindUserByLicensePlate = () => {
  return useMutation({
    mutationFn: async (licensePlate: string) => {
      console.log('[useFindUserByLicensePlate] Looking up:', licensePlate);
      
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .ilike('license_plate', licensePlate.toLowerCase())
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('[useFindUserByLicensePlate] Error:', JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details
        }));
      }
      
      return data?.id || null;
    },
  });
};

export const getUserLicensePlateWithState = (user: User | null | undefined): string => {
  if (!user) return '';
  if (!user.licensePlate) return '';
  if (user.licensePlate.includes('-')) return user.licensePlate;
  if (user.state) return `${user.state}-${user.licensePlate}`;
  return user.licensePlate;
};
