import { adminProcedure } from "../../../create-context";
import { getAllUsers } from "@/backend/services/user-service";
import { initDatabase } from "@/backend/database";

export const getAllUsersRoute = adminProcedure.query(async ({ ctx }) => {
  console.log('[Admin] Getting all users. Admin:', ctx.userEmail);
  
  try {
    await initDatabase();
    const users = await getAllUsers();
    
    console.log(`[Admin] Found ${users.length} users`);
    
    return {
      users,
      count: users.length,
    };
  } catch (error) {
    console.error('[Admin] Error getting all users:', error);
    throw new Error('Failed to get users');
  }
});

export default getAllUsersRoute;
