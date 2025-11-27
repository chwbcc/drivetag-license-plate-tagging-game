import { superAdminProcedure } from "../../../create-context";
import { z } from "zod";

const updateUserRoleSchema = z.object({
  userId: z.string(),
  adminRole: z.enum(['super_admin', 'admin', 'moderator']).nullable(),
});

export const updateUserRoleRoute = superAdminProcedure
  .input(updateUserRoleSchema)
  .mutation(async ({ ctx, input }) => {
    console.log('Super admin updating user role:', {
      admin: ctx.userEmail,
      targetUserId: input.userId,
      newRole: input.adminRole,
    });
    
    return {
      success: true,
      message: "This is a mock endpoint. In production, this would update the user role in the database.",
      userId: input.userId,
      newRole: input.adminRole,
    };
  });

export default updateUserRoleRoute;
