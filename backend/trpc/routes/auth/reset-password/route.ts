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
      
      const result = await db.execute({
        sql: 'SELECT id, resetToken, resetTokenExpiry FROM users WHERE LOWER(email) = ?',
        args: [input.email.toLowerCase()]
      });
      
      if (result.rows.length === 0) {
        console.log('[Auth] User not found:', input.email);
        return {
          success: false,
          message: 'Invalid reset code.',
        };
      }
      
      const row = result.rows[0];
      const userId = row.id as string;
      const storedToken = row.resetToken as string | null;
      const tokenExpiry = row.resetTokenExpiry as number | null;
      
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
      
      await db.execute({
        sql: 'UPDATE users SET passwordHash = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?',
        args: [input.newPassword, userId]
      });
      
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
