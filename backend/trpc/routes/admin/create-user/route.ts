import { adminProcedure } from "../../../create-context";
import { createUser } from "@/backend/services/user-service";
import { initDatabase } from "@/backend/database";
import { z } from "zod";
import { hashPassword } from "@/utils/hash";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  licensePlate: z.string().optional(),
  state: z.string().optional(),
  pelletCount: z.number().optional(),
  positivePelletCount: z.number().optional(),
  exp: z.number().optional(),
  level: z.number().optional(),
  adminRole: z.enum(['super_admin', 'admin', 'moderator', 'user']).optional(),
});

export const createUserRoute = adminProcedure
  .input(createUserSchema)
  .mutation(async ({ input, ctx }) => {
    console.log('[Admin] Creating new user. Admin:', ctx.userEmail);
    
    try {
      await initDatabase();
      
      const hashedPassword = await hashPassword(input.password);
      
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const user = await createUser({
        id: userId,
        email: input.email,
        password: hashedPassword,
        name: input.name,
        photo: undefined,
        licensePlate: input.licensePlate || '',
        state: input.state,
        adminRole: input.adminRole === 'user' ? null : input.adminRole as any,
      });
      
      if (input.pelletCount !== undefined || input.positivePelletCount !== undefined || 
          input.exp !== undefined || input.level !== undefined) {
        const { updateUser } = await import("@/backend/services/user-service");
        await updateUser(userId, {
          pelletCount: input.pelletCount ?? 10,
          positivePelletCount: input.positivePelletCount ?? 5,
          exp: input.exp ?? 0,
          level: input.level ?? 1,
        });
      }
      
      console.log('[Admin] User created successfully:', user.email);
      
      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('[Admin] Error creating user:', error);
      throw new Error(error.message || 'Failed to create user');
    }
  });

export default createUserRoute;
