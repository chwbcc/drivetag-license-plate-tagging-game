import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { updateUser } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const syncUserSchema = z.object({
  name: z.string().optional(),
  photo: z.string().optional(),
  licensePlate: z.string().optional(),
  state: z.string().optional(),
  pelletCount: z.number().optional(),
  positivePelletCount: z.number().optional(),
  exp: z.number().optional(),
  level: z.number().optional(),
  password: z.string().optional(),
});

export const syncUserRoute = protectedProcedure
  .input(syncUserSchema)
  .mutation(async ({ ctx, input }) => {
    console.log('[Auth] Syncing user data:', ctx.userEmail);
    
    try {
      await initDatabase();
      
      const user = await updateUser(ctx.userId!, input);
      
      await logUserActivity(ctx.userId!, 'user_data_synced', {
        updatedFields: Object.keys(input),
      });
      
      console.log('[Auth] User data synced successfully:', ctx.userEmail);
      
      return {
        success: true,
        message: 'User data synced successfully',
        user,
      };
    } catch (error) {
      console.error('[Auth] Error syncing user data:', error);
      throw new Error('Failed to sync user data');
    }
  });

export default syncUserRoute;
