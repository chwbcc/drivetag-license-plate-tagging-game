import { adminProcedure } from "../../../create-context";
import { updateUser } from "@/backend/services/user-service";
import { initDatabase } from "@/backend/database";
import { z } from "zod";
import { hashPassword } from "@/utils/hash";

const updateUserSchema = z.object({
  userId: z.string(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  name: z.string().optional(),
  licensePlate: z.string().optional(),
  state: z.string().optional(),
  pelletCount: z.number().optional(),
  positivePelletCount: z.number().optional(),
  exp: z.number().optional(),
  level: z.number().optional(),
  adminRole: z.enum(['super_admin', 'admin', 'moderator', 'user']).nullable().optional(),
});

export const updateUserRoute = adminProcedure
  .input(updateUserSchema)
  .mutation(async ({ input, ctx }) => {
    console.log('[Admin] Updating user. Admin:', ctx.userEmail, 'Target:', input.userId);
    
    try {
      await initDatabase();
      
      const updates: any = {};
      
      if (input.name !== undefined) updates.name = input.name;
      if (input.licensePlate !== undefined) updates.licensePlate = input.licensePlate;
      if (input.state !== undefined) updates.state = input.state;
      if (input.pelletCount !== undefined) updates.pelletCount = input.pelletCount;
      if (input.positivePelletCount !== undefined) updates.positivePelletCount = input.positivePelletCount;
      if (input.exp !== undefined) updates.exp = input.exp;
      if (input.level !== undefined) updates.level = input.level;
      
      if (input.adminRole !== undefined) {
        updates.adminRole = input.adminRole === 'user' ? null : input.adminRole;
      }
      
      if (input.password) {
        updates.password = await hashPassword(input.password);
      }
      
      const updatedUser = await updateUser(input.userId, updates);
      
      console.log('[Admin] User updated successfully:', input.userId);
      
      return {
        success: true,
        user: updatedUser,
      };
    } catch (error: any) {
      console.error('[Admin] Error updating user:', error);
      throw new Error(error.message || 'Failed to update user');
    }
  });

export default updateUserRoute;
