import { adminProcedure } from "../../../create-context";
import { getAllPellets } from "@/backend/services/pellet-service";
import { initDatabase } from "@/backend/database";

export const getAllPelletsRoute = adminProcedure.query(async ({ ctx }) => {
  console.log('[Admin] Getting all pellets. Admin:', ctx.userEmail);
  
  try {
    await initDatabase();
    const pellets = await getAllPellets();
    
    console.log(`[Admin] Found ${pellets.length} pellets`);
    
    return {
      pellets,
      count: pellets.length,
    };
  } catch (error) {
    console.error('[Admin] Error getting all pellets:', error);
    throw new Error('Failed to get pellets');
  }
});

export default getAllPelletsRoute;
