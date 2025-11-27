import { superAdminProcedure } from "../../../create-context";
import { z } from "zod";
import { updateUserAdminRole } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const updateUserRoleSchema = z.object({
  userId: z.string(),
  adminRole: z.enum(['super_admin', 'admin', 'moderator']).nullable(),
});

export const updateUserRoleRoute = superAdminProcedure
  .input(updateUserRoleSchema)
  .mutation(async ({ ctx, input }) => {
    console.log('[Admin] Super admin updating user role:', {
      admin: ctx.userEmail,
      targetUserId: input.userId,
      newRole: input.adminRole,
    });
    
    try {
      await initDatabase();
      await updateUserAdminRole(input.userId, input.adminRole);
      
      await logUserActivity(ctx.userId!, 'update_user_role', {
        targetUserId: input.userId,
        newRole: input.adminRole,
      });
      
      console.log(`[Admin] Successfully updated user ${input.userId} role to ${input.adminRole}`);
      
      return {
        success: true,
        message: 'User role updated successfully',
        userId: input.userId,
        newRole: input.adminRole,
      };
    } catch (error) {
      console.error('[Admin] Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  });

export default updateUserRoleRoute;
