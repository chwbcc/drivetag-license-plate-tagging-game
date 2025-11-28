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
      console.log('[Auth] Initializing database...');
      await initDatabase();
      console.log('[Auth] Database initialized, fetching user...');
      
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
      
      console.log('[Auth] Password verified, logging activity...');
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
      
      if (error instanceof Error) {
        if (error.message.includes('TURSO_DATABASE_URL')) {
          return {
            success: false,
            message: 'Database configuration error. Please check Turso setup.',
            user: null,
          };
        }
      }
      
      return {
        success: false,
        message: 'Failed to login. Please try again.',
        user: null,
      };
    }
  });

export default loginRoute;
