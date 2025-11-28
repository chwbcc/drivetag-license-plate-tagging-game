import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/backend/services/user-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const registerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string(),
  name: z.string().optional(),
  licensePlate: z.string(),
  state: z.string().optional(),
  photo: z.string().optional(),
  adminRole: z.enum(['super_admin', 'admin', 'moderator']).nullable().optional(),
});

export const registerRoute = publicProcedure
  .input(registerSchema)
  .mutation(async ({ input }) => {
    console.log('[Auth] Registering user:', input.email);
    
    try {
      console.log('[Auth] Initializing database...');
      await initDatabase();
      console.log('[Auth] Database initialized successfully');
      
      const existingUser = await getUserByEmail(input.email);
      
      if (existingUser) {
        console.log('[Auth] User already exists:', input.email);
        return {
          success: false,
          message: 'User with this email already exists',
          user: null,
        };
      }
      
      // Assign super_admin role to chwbcc@gmail.com
      let adminRole = input.adminRole || null;
      if (input.email.toLowerCase() === 'chwbcc@gmail.com') {
        adminRole = 'super_admin';
        console.log('[Auth] Assigning super_admin role to:', input.email);
      }
      
      const user = await createUser({
        id: input.id,
        email: input.email,
        password: input.password,
        name: input.name,
        licensePlate: input.licensePlate,
        state: input.state,
        photo: input.photo,
        adminRole: adminRole,
      });
      
      await logUserActivity(user.id, 'user_registered', {
        email: user.email,
      });
      
      console.log('[Auth] User registered successfully:', user.email);
      
      return {
        success: true,
        message: 'User registered successfully',
        user,
      };
    } catch (error: any) {
      console.error('[Auth] Error registering user:', error);
      console.error('[Auth] Error details:', {
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause,
      });
      
      const errorMessage = error?.message || 'Failed to register user';
      throw new Error(errorMessage);
    }
  });

export default registerRoute;
