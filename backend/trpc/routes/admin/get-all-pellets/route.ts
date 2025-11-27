import { adminProcedure } from "../../../create-context";
import { getAllPellets } from "@/backend/services/pellet-service";
import { getUserById } from "@/backend/services/user-service";
import { initDatabase } from "@/backend/database";

export const getAllPelletsRoute = adminProcedure.query(async ({ ctx }) => {
  console.log('[Admin] Getting all pellets. Admin:', ctx.userEmail);
  
  try {
    await initDatabase();
    const pellets = await getAllPellets();
    
    const pelletsWithUserInfo = await Promise.all(
      pellets.map(async (pellet) => {
        try {
          const user = await getUserById(pellet.createdBy);
          return {
            ...pellet,
            userEmail: user.email,
            licensePlate: pellet.targetLicensePlate,
            notes: pellet.reason,
          };
        } catch (error) {
          return {
            ...pellet,
            userEmail: 'Unknown',
            licensePlate: pellet.targetLicensePlate,
            notes: pellet.reason,
          };
        }
      })
    );
    
    console.log(`[Admin] Found ${pelletsWithUserInfo.length} pellets`);
    
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
