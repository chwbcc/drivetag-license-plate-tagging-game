import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { getUserByEmail } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SUPER_ADMIN_EMAIL = 'chwbcc@gmail.com';
const SUPER_ADMIN_BYPASS = true;

export const loginRoute = publicProcedure
  .input(loginSchema)
  .mutation(async ({ input }) => {
    console.log('[Auth] Login attempt:', input.email);
    
    if (SUPER_ADMIN_BYPASS && input.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      console.log('[Auth] 🔓 Super Admin bypass activated');
      
      const superAdminUser = {
        id: 'super-admin-1',
        email: SUPER_ADMIN_EMAIL,
        name: 'Super Admin',
        licensePlate: 'ADMIN',
        state: 'CA',
        pelletCount: 99999,
        positivePelletCount: 99999,
        badges: ['super-admin-badge'],
        exp: 999999,
        level: 99,
        adminRole: 'super_admin' as const,
        password: input.password,
      };
      
      return {
        success: true,
        message: 'Super Admin login successful (bypass mode)',
        user: superAdminUser,
      };
    }
    
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
