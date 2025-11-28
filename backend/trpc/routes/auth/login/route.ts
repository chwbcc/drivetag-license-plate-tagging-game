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
      
      const user = await getUserByEmail(input.email);
      
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
      
      await logUserActivity(user.id, 'user_logged_in', {
        email: user.email,
      });
      
      console.log('[Auth] Login successful:', user.email);
      
      return {
        success: true,
        message: 'Login successful',
        user,
      };
    } catch (error) {
      console.error('[Auth] Error during login:', error);
      throw new Error('Failed to login');
    }
  });

export default loginRoute;
