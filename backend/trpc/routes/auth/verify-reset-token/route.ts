import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { initDatabase, getDatabase } from "@/backend/database";

const verifyResetTokenSchema = z.object({
  email: z.string().email(),
  token: z.string(),
});

export const verifyResetTokenRoute = publicProcedure
  .input(verifyResetTokenSchema)
  .query(async ({ input }) => {
    console.log('[Auth] Verifying reset token for:', input.email);
    
    try {
      await initDatabase();
      const db = getDatabase();
      
      const { data, error } = await db
        .from('users')
        .select('resetToken, resetTokenExpiry')
        .ilike('email', input.email.toLowerCase())
        .single();
      
      if (error || !data) {
        console.log('[Auth] User not found:', input.email);
        return {
          success: false,
          message: 'Invalid reset code.',
        };
      }
      
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
      
      console.log('[Auth] Token verified successfully');
      return {
        success: true,
        message: 'Token verified successfully.',
      };
    } catch (error) {
      console.error('[Auth] Error verifying reset token:', error);
      
      return {
        success: false,
        message: 'An error occurred. Please try again.',
      };
    }
  });

export default verifyResetTokenRoute;
