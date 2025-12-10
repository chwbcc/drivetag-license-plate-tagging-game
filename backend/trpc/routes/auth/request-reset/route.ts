import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { getUserByEmail } from "@/backend/services/user-service";
import { initDatabase, getDatabase } from "@/backend/database";

const requestResetSchema = z.object({
  email: z.string().email(),
});

export const requestResetRoute = publicProcedure
  .input(requestResetSchema)
  .mutation(async ({ input }) => {
    console.log('[Auth] Password reset requested for:', input.email);
    
    try {
      await initDatabase();
      
      const user = await getUserByEmail(input.email);
      
      if (!user) {
        console.log('[Auth] User not found for reset:', input.email);
        return {
          success: true,
          message: 'If the email exists, a reset code has been sent.',
        };
      }
      
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
      const resetTokenExpiry = Date.now() + 15 * 60 * 1000;
      
      const db = getDatabase();
      const { error } = await db
        .from('users')
        .update({
          resetToken,
          resetTokenExpiry,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      console.log('[Auth] Reset token generated:', resetToken);
      console.log('[Auth] Token will expire at:', new Date(resetTokenExpiry).toISOString());
      
      return {
        success: true,
        message: 'If the email exists, a reset code has been sent.',
        resetToken,
      };
    } catch (error) {
      console.error('[Auth] Error requesting password reset:', error);
      
      return {
        success: false,
        message: 'An error occurred. Please try again.',
      };
    }
  });

export default requestResetRoute;
