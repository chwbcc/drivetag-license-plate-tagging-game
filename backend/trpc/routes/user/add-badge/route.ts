import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { addBadgeToUser } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const addBadgeSchema = z.object({
  badgeId: z.string(),
});

export const addBadgeRoute = protectedProcedure
  .input(addBadgeSchema)
  .mutation(async ({ ctx, input }) => {
    console.log('[User] Adding badge:', {
      user: ctx.userEmail,
      badgeId: input.badgeId,
    });
    
    try {
      console.log('[User] Ensuring database is initialized...');
      await initDatabase();
      
      console.log('[User] Adding badge to user in database...');
      await addBadgeToUser(ctx.userId!, input.badgeId);
      
      console.log('[User] Logging user activity...');
      await logUserActivity(ctx.userId!, 'badge_earned', {
        badgeId: input.badgeId,
      });
      
      console.log('[User] Badge added successfully:', ctx.userId, input.badgeId);
      
      return {
        success: true,
        message: 'Badge added successfully',
      };
    } catch (error: any) {
      console.error('[User] Error adding badge:', error);
      console.error('[User] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      throw new Error(`Failed to add badge: ${error?.message || 'Unknown error'}`);
    }
  });

export default addBadgeRoute;
