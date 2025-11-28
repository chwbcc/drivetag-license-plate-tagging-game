import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { updateUserExperience } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const updateExperienceSchema = z.object({
  exp: z.number(),
  level: z.number(),
});

export const updateExperienceRoute = protectedProcedure
  .input(updateExperienceSchema)
  .mutation(async ({ ctx, input }) => {
    console.log('[User] Updating experience:', {
      user: ctx.userEmail,
      exp: input.exp,
      level: input.level,
    });
    
    try {
      console.log('[User] Ensuring database is initialized...');
      await initDatabase();
      
      console.log('[User] Updating user experience in database...');
      const updatedUser = await updateUserExperience(
        ctx.userId!,
        input.exp,
        input.level
      );
      
      console.log('[User] Logging user activity...');
      await logUserActivity(ctx.userId!, 'experience_updated', {
        exp: input.exp,
        level: input.level,
      });
      
      console.log('[User] Experience updated successfully:', ctx.userId);
      
      return {
        success: true,
        user: updatedUser,
      };
    } catch (error: any) {
      console.error('[User] Error updating experience:', error);
      console.error('[User] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      throw new Error(`Failed to update experience: ${error?.message || 'Unknown error'}`);
    }
  });

export default updateExperienceRoute;
