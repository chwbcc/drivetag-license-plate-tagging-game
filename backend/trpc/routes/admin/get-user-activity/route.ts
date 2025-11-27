import { adminProcedure } from "../../../create-context";
import { z } from "zod";
import { getUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const getUserActivitySchema = z.object({
  userId: z.string(),
  limit: z.number().optional(),
});

export const getUserActivityRoute = adminProcedure
  .input(getUserActivitySchema)
  .query(async ({ ctx, input }) => {
    console.log('[Admin] Accessing user activity:', {
      admin: ctx.userEmail,
      targetUserId: input.userId,
    });
    
    try {
      await initDatabase();
      const activity = await getUserActivity(input.userId, input.limit || 50);
      
      console.log(`[Admin] Found ${activity.length} activity records for user ${input.userId}`);
      
      return {
        userId: input.userId,
        activity,
        count: activity.length,
      };
    } catch (error) {
      console.error('[Admin] Error getting user activity:', error);
      throw new Error('Failed to get user activity');
    }
  });

export default getUserActivityRoute;
