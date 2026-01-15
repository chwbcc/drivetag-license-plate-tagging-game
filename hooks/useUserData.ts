import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabase';
import { User, AdminRole } from '@/types';
import useAuthStore from '@/store/auth-store';

const mapDatabaseUserToUser = (data: any): User => {
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
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', localUser.id)
        .single();
      
      if (error) {
        console.error('[useCurrentUser] Error fetching user:', error);
        throw error;
      }
      
      if (!data) {
        console.log('[useCurrentUser] No user found in database');
        return null;
      }
      
      const user = mapDatabaseUserToUser(data);
      console.log('[useCurrentUser] Fetched user:', user.email, 'Level:', user.level, 'Exp:', user.exp);
      
      updateLocalUser(user);
      
      return user;
    },
    enabled: !!localUser?.id,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

export const useUserPelletCounts = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['userPelletCounts', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      console.log('[useUserPelletCounts] Fetching pellet counts for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('negative_pellet_count, positive_pellet_count, pellets_given_count, positive_pellets_given_count, negative_pellets_given_count, positive_rating_count, negative_rating_count')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[useUserPelletCounts] Error:', error);
        throw error;
      }
      
      return {
        negativePelletCount: (data?.negative_pellet_count as number) || 0,
        positivePelletCount: (data?.positive_pellet_count as number) || 0,
        pelletsGivenCount: (data?.pellets_given_count as number) || 0,
        positivePelletsGivenCount: (data?.positive_pellets_given_count as number) || 0,
        negativePelletsGivenCount: (data?.negative_pellets_given_count as number) || 0,
        positiveRatingCount: (data?.positive_rating_count as number) || 0,
        negativeRatingCount: (data?.negative_rating_count as number) || 0,
      };
    },
    enabled: !!userId,
    staleTime: 10000,
  });
};

export const useUserStats = (userId: string | undefined, licensePlate: string | undefined) => {
  return useQuery({
    queryKey: ['userStats', userId, licensePlate],
    queryFn: async () => {
      if (!userId || !licensePlate) return null;
      
      console.log('[useUserStats] Fetching stats for:', userId, licensePlate);
      
      const [userResult, pelletsGivenResult, pelletsReceivedResult] = await Promise.all([
        supabase
          .from('users')
          .select('experience, level, badges, negative_pellet_count, positive_pellet_count, pellets_given_count, positive_pellets_given_count, negative_pellets_given_count, positive_rating_count, negative_rating_count')
          .eq('id', userId)
          .single(),
        supabase
          .from('pellets')
          .select('type')
          .eq('created_by', userId),
        supabase
          .from('pellets')
          .select('type')
          .ilike('license_plate', licensePlate.toLowerCase()),
      ]);
      
      if (userResult.error) {
        console.error('[useUserStats] Error fetching user:', userResult.error);
        throw userResult.error;
      }
      
      const userData = userResult.data;
      const pelletsGiven = pelletsGivenResult.data || [];
      const pelletsReceived = pelletsReceivedResult.data || [];
      
      const stats = {
        exp: (userData?.experience as number) || 0,
        level: (userData?.level as number) || 1,
        badges: typeof userData?.badges === 'string' ? JSON.parse(userData.badges) : (userData?.badges || []),
        negativePelletCount: (userData?.negative_pellet_count as number) || 0,
        positivePelletCount: (userData?.positive_pellet_count as number) || 0,
        pelletsGivenCount: pelletsGiven.length,
        positivePelletsGivenCount: pelletsGiven.filter((p: any) => p.type === 'positive').length,
        negativePelletsGivenCount: pelletsGiven.filter((p: any) => p.type === 'negative').length,
        pelletsReceivedCount: pelletsReceived.length,
        positiveRatingCount: pelletsReceived.filter((p: any) => p.type === 'positive').length,
        negativeRatingCount: pelletsReceived.filter((p: any) => p.type === 'negative').length,
      };
      
      console.log('[useUserStats] Stats:', stats);
      
      return stats;
    },
    enabled: !!userId && !!licensePlate,
    staleTime: 10000,
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
      console.log('[useUpdateUserAfterTag] Updating user after tag:', userId, pelletType, expGained);
      
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError) throw fetchError;
      
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
      
      if (updateError) throw updateError;
      
      return { userId, updateData };
    },
    onSuccess: (data) => {
      console.log('[useUpdateUserAfterTag] Success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
      queryClient.invalidateQueries({ queryKey: ['userPelletCounts'] });
      queryClient.invalidateQueries({ queryKey: ['pellets'] });
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
      console.log('[useUpdateTargetUserRating] Updating target user rating:', targetUserId, pelletType);
      
      const ratingColumn = pelletType === 'positive' ? 'positive_rating_count' : 'negative_rating_count';
      
      const { data: targetUser, error: fetchError } = await supabase
        .from('users')
        .select('positive_rating_count, negative_rating_count')
        .eq('id', targetUserId)
        .single();
      
      if (fetchError) {
        console.error('[useUpdateTargetUserRating] Error fetching target user:', fetchError);
        throw fetchError;
      }
      
      const currentCount = pelletType === 'positive' 
        ? ((targetUser?.positive_rating_count as number) || 0)
        : ((targetUser?.negative_rating_count as number) || 0);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ [ratingColumn]: currentCount + 1 })
        .eq('id', targetUserId);
      
      if (updateError) throw updateError;
      
      return { targetUserId, pelletType };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
};

export const useCreatePellet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      licensePlate,
      targetUserId,
      createdBy,
      createdAt,
      reason,
      type,
      latitude,
      longitude,
    }: {
      id: string;
      licensePlate: string;
      targetUserId: string | null;
      createdBy: string;
      createdAt: number;
      reason: string;
      type: 'positive' | 'negative';
      latitude?: number;
      longitude?: number;
    }) => {
      console.log('[useCreatePellet] Creating pellet:', { id, licensePlate, type, createdBy });
      
      const { error } = await supabase
        .from('pellets')
        .insert([{
          id,
          license_plate: licensePlate,
          targetuserid: targetUserId,
          created_by: createdBy,
          created_at: createdAt,
          notes: reason,
          type,
          latitude: latitude || null,
          longitude: longitude || null,
        }]);
      
      if (error) throw error;
      
      return { id, licensePlate, type };
    },
    onSuccess: () => {
      console.log('[useCreatePellet] Success, invalidating pellet queries');
      queryClient.invalidateQueries({ queryKey: ['pellets'] });
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
        console.error('[useFindUserByLicensePlate] Error:', error);
      }
      
      return data?.id || null;
    },
  });
};
