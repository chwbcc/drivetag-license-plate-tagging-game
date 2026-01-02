import { adminProcedure } from "../../../create-context";
import { getAllUsers } from "@/backend/services/user-service";

export const getAllUsersRoute = adminProcedure.query(async ({ ctx }) => {
  console.log('[Admin] Getting all users. Admin:', ctx.userEmail);
  
  try {
    console.log('[Admin] Fetching users...');
    
    const users = await getAllUsers();
    
    console.log(`[Admin] Found ${users.length} users`);
    
    return {
      users,
      count: users.length,
    };
  } catch (error) {
    console.error('[Admin] Error getting all users:', error);
    console.error('[Admin] Error details:', {
      message: (error as any)?.message,
      code: (error as any)?.code,
      stack: (error as any)?.stack,
    });
    throw new Error(`Failed to get users: ${(error as any)?.message || 'Unknown error'}`);
  }
});

export default getAllUsersRoute;
