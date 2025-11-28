import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { updateUserPelletCount } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const updatePelletCountSchema = z.object({
  pelletCount: z.number(),
  positivePelletCount: z.number(),
});

export const updatePelletCountRoute = protectedProcedure
  .input(updatePelletCountSchema)
  .mutation(async ({ ctx, input }) => {
    console.log('[User] Updating pellet count:', {
      user: ctx.userEmail,
      pelletCount: input.pelletCount,
      positivePelletCount: input.positivePelletCount,
    });
    
    try {
      console.log('[User] Ensuring database is initialized...');
      await initDatabase();
      
      console.log('[User] Updating user pellet count in database...');
      const updatedUser = await updateUserPelletCount(
        ctx.userId!,
        input.pelletCount,
        input.positivePelletCount
      );
      
      console.log('[User] Logging user activity...');
      await logUserActivity(ctx.userId!, 'pellet_count_updated', {
        pelletCount: input.pelletCount,
        positivePelletCount: input.positivePelletCount,
      });
      
      console.log('[User] Pellet count updated successfully:', ctx.userId);
      
      return {
        success: true,
        user: updatedUser,
      };
    } catch (error: any) {
      console.error('[User] Error updating pellet count:', error);
      console.error('[User] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      throw new Error(`Failed to update pellet count: ${error?.message || 'Unknown error'}`);
    }
  });

export default updatePelletCountRoute;
