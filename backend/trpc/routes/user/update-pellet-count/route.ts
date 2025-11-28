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
      await initDatabase();
      
      const updatedUser = await updateUserPelletCount(
        ctx.userId!,
        input.pelletCount,
        input.positivePelletCount
      );
      
      await logUserActivity(ctx.userId!, 'pellet_count_updated', {
        pelletCount: input.pelletCount,
        positivePelletCount: input.positivePelletCount,
      });
      
      console.log('[User] Pellet count updated successfully:', ctx.userId);
      
      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      console.error('[User] Error updating pellet count:', error);
      throw new Error('Failed to update pellet count');
    }
  });

export default updatePelletCountRoute;
