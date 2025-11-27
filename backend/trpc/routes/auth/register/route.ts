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
      await initDatabase();
      
      const existingUser = await getUserByEmail(input.email);
      
      if (existingUser) {
        console.log('[Auth] User already exists:', input.email);
        return {
          success: false,
          message: 'User with this email already exists',
          user: null,
        };
      }
      
      const user = await createUser({
        id: input.id,
        email: input.email,
        password: input.password,
        name: input.name,
        licensePlate: input.licensePlate,
        state: input.state,
        photo: input.photo,
        adminRole: input.adminRole || null,
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
    } catch (error) {
      console.error('[Auth] Error registering user:', error);
      throw new Error('Failed to register user');
    }
  });

export default registerRoute;
