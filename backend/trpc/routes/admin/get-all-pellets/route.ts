import { adminProcedure } from "../../../create-context";
import { getAllPellets } from "@/backend/services/pellet-service";
import { getUsersByIds } from "@/backend/services/user-service";

export const getAllPelletsRoute = adminProcedure.query(async ({ ctx }) => {
  console.log('[Admin] Getting all pellets. Admin:', ctx.userEmail);
  
  try {
    console.log('[Admin] Fetching pellets...');
    
    const pellets = await getAllPellets();
    console.log(`[Admin] Found ${pellets.length} pellets`);
    
    if (pellets.length === 0) {
      return {
        pellets: [],
        count: 0,
      };
    }
    
    const uniqueUserIds = [...new Set(pellets.map(p => p.createdBy))];
    console.log(`[Admin] Fetching ${uniqueUserIds.length} unique users in batch...`);
    
    const userMap = await getUsersByIds(uniqueUserIds);
    console.log(`[Admin] Fetched ${userMap.size} users`);
    
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
    console.error('[Admin] Error details:', {
      message: (error as any)?.message,
      code: (error as any)?.code,
      stack: (error as any)?.stack,
    });
    throw new Error(`Failed to get pellets: ${(error as any)?.message || 'Unknown error'}`);
  }
});

export default getAllPelletsRoute;
