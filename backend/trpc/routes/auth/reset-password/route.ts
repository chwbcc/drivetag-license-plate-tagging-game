import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { initDatabase, getDatabase } from "@/backend/database";
import { logUserActivity } from "@/backend/services/activity-service";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  newPassword: z.string().min(6),
});

export const resetPasswordRoute = publicProcedure
  .input(resetPasswordSchema)
  .mutation(async ({ input }) => {
    console.log('[Auth] Resetting password for:', input.email);
    
    try {
      await initDatabase();
      const db = getDatabase();
      
      const { data, error } = await db
        .from('users')
        .select('id, resetToken, resetTokenExpiry')
        .ilike('email', input.email.toLowerCase())
        .single();
      
      if (error || !data) {
        console.log('[Auth] User not found:', input.email);
        return {
          success: false,
          message: 'Invalid reset code.',
        };
      }
      
      const userId = data.id as string;
      const storedToken = data.resetToken as string | null;
      const tokenExpiry = data.resetTokenExpiry as number | null;
      
      if (!storedToken || !tokenExpiry) {
        console.log('[Auth] No reset token found for user');
        return {
          success: false,
          message: 'Invalid reset code.',
        };
      }
      
      if (Date.now() > tokenExpiry) {
        console.log('[Auth] Reset token expired');
        return {
          success: false,
          message: 'Reset code has expired. Please request a new one.',
        };
      }
      
      if (storedToken !== input.token) {
        console.log('[Auth] Token mismatch');
        return {
          success: false,
          message: 'Invalid reset code.',
        };
      }
      
      const { error: updateError } = await db
        .from('users')
        .update({
          passwordHash: input.newPassword,
          resetToken: null,
          resetTokenExpiry: null,
        })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      console.log('[Auth] Password reset successfully for:', input.email);
      
      try {
        await logUserActivity(userId, 'password_reset', {
          email: input.email,
        });
      } catch (activityError) {
        console.error('[Auth] Failed to log password reset activity (non-critical):', activityError);
      }
      
      return {
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      };
    } catch (error) {
      console.error('[Auth] Error resetting password:', error);
      
      return {
        success: false,
        message: 'An error occurred. Please try again.',
      };
    }
  });

export default resetPasswordRoute;
