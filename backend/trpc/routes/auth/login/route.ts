import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { getUserByEmail } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const loginRoute = publicProcedure
  .input(loginSchema)
  .mutation(async ({ input }) => {
    console.log('[Auth] Login attempt:', input.email);
    
    try {
      await initDatabase();
      console.log('[Auth] Database initialized');
      
      const user = await getUserByEmail(input.email);
      console.log('[Auth] User lookup result:', user ? 'Found' : 'Not found');
      
      if (!user) {
        console.log('[Auth] User not found:', input.email);
        return {
          success: false,
          message: 'Invalid email or password',
          user: null,
        };
      }
      
      if (user.password !== input.password) {
        console.log('[Auth] Invalid password for user:', input.email);
        return {
          success: false,
          message: 'Invalid email or password',
          user: null,
        };
      }
      
      console.log('[Auth] Password verified, logging activity');
      
      try {
        await logUserActivity(user.id, 'user_logged_in', {
          email: user.email,
        });
        console.log('[Auth] Activity logged successfully');
      } catch (activityError) {
        console.error('[Auth] Failed to log activity (non-critical):', activityError);
      }
      
      console.log('[Auth] Login successful:', user.email, 'adminRole:', user.adminRole);
      
      return {
        success: true,
        message: 'Login successful',
        user,
      };
    } catch (error) {
      console.error('[Auth] Error during login:', error);
      console.error('[Auth] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      return {
        success: false,
        message: errorMessage.includes('Database') ? 'Database connection error. Please try again.' : 'Invalid email or password',
        user: null,
      };
    }
  });

export default loginRoute;
