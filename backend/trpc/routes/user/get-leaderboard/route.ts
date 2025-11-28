import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { getAllUsers } from "@/backend/services/user-service";
import { getAllPellets } from "@/backend/services/pellet-service";
import { initDatabase } from "@/backend/database";

const getLeaderboardSchema = z.object({
  type: z.enum(['pellets', 'experience']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  pelletType: z.enum(['negative', 'positive', 'all']).optional().default('all'),
});

export const getLeaderboardRoute = publicProcedure
  .input(getLeaderboardSchema)
  .query(async ({ input }) => {
    console.log('[Leaderboard] Getting leaderboard data:', input);
    
    try {
      await initDatabase();
      
      const type = input.type || 'pellets';
      
      if (type === 'pellets') {
        const pellets = await getAllPellets();
        
        const filteredPellets = input.pelletType === 'all' 
          ? pellets 
          : pellets.filter(pellet => pellet.type === input.pelletType);
        
        const plateMap = new Map<string, { count: number; targetUserId?: string }>();
        
        filteredPellets.forEach(pellet => {
          const plate = pellet.targetLicensePlate;
          const current = plateMap.get(plate) || { count: 0, targetUserId: pellet.targetUserId };
          plateMap.set(plate, {
            count: current.count + 1,
            targetUserId: pellet.targetUserId || current.targetUserId
          });
        });
        
        const leaderboard = Array.from(plateMap.entries()).map(([licensePlate, data]) => ({
          licensePlate,
          count: data.count,
          targetUserId: data.targetUserId,
        }));
        
        leaderboard.sort((a, b) => {
          return input.sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
        });
        
        console.log('[Leaderboard] Pellet leaderboard retrieved:', leaderboard.length);
        
        return {
          success: true,
          type: 'pellets',
          data: leaderboard,
        };
      } else {
        const users = await getAllUsers();
        
        const expLeaderboard = users.map(user => ({
          id: user.id,
          name: user.name || user.email.split('@')[0],
          exp: user.exp || 0,
          level: user.level || 1,
        }));
        
        expLeaderboard.sort((a, b) => {
          return input.sortOrder === 'desc' ? b.exp - a.exp : a.exp - b.exp;
        });
        
        console.log('[Leaderboard] Experience leaderboard retrieved:', expLeaderboard.length);
        
        return {
          success: true,
          type: 'experience',
          data: expLeaderboard,
        };
      }
    } catch (error) {
      console.error('[Leaderboard] Error getting leaderboard:', error);
      throw new Error('Failed to get leaderboard data');
    }
  });

export default getLeaderboardRoute;
