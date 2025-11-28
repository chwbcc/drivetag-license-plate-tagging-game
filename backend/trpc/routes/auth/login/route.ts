import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { getUserByEmail } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";
import { AdminRole } from "@/types";

const SUPER_ADMIN_EMAIL = 'chwbcc@gmail.com';

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
      
      const adminRole: AdminRole = user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
        ? 'super_admin'
        : user.adminRole || null;
      
      const userWithRole = {
        ...user,
        adminRole: adminRole,
      };
      
      console.log('[Auth] Login successful:', user.email, 'with role:', adminRole);
      
      return {
        success: true,
        message: 'Login successful',
        user: userWithRole,
      };
    } catch (error) {
      console.error('[Auth] Error during login:', error);
      throw new Error('Failed to login');
    }
  });

export default loginRoute;
