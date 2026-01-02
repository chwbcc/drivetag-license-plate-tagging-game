import { adminProcedure } from "../../../create-context";
import { getAllPellets } from "@/backend/services/pellet-service";
import { getUserById } from "@/backend/services/user-service";
import { initDatabase } from "@/backend/database";

export const getAllPelletsRoute = adminProcedure.query(async ({ ctx }) => {
  console.log('[Admin] Getting all pellets. Admin:', ctx.userEmail);
  
  try {
    await initDatabase();
    const pellets = await getAllPellets();
    
    console.log(`[Admin] Found ${pellets.length} pellets, fetching user info...`);
    
    const uniqueUserIds = [...new Set(pellets.map(p => p.createdBy))];
    console.log(`[Admin] Fetching ${uniqueUserIds.length} unique users`);
    
    const userMap = new Map<string, { email: string }>();
    
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const user = await getUserById(userId);
          userMap.set(userId, { email: user.email });
        } catch (error) {
          console.error(`[Admin] Failed to fetch user ${userId}:`, error);
          userMap.set(userId, { email: 'Unknown' });
        }
      })
    );
    
    const pelletsWithUserInfo = pellets.map((pellet) => ({
      ...pellet,
      userEmail: userMap.get(pellet.createdBy)?.email || 'Unknown',
      licensePlate: pellet.targetLicensePlate,
      notes: pellet.reason,
    }));
    
    console.log(`[Admin] Returning ${pelletsWithUserInfo.length} pellets with user info`);
    
    return {
      pellets: pelletsWithUserInfo,
      count: pelletsWithUserInfo.length,
    };
  } catch (error) {
    console.error('[Admin] Error getting all pellets:', error);
    throw new Error('Failed to get pellets');
  }
});

export default getAllPelletsRoute;
