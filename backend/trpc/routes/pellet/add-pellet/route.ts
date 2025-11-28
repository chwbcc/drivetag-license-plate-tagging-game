import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { createPellet } from "@/backend/services/pellet-service";
import { logUserActivity } from "@/backend/services/activity-service";
import { initDatabase } from "@/backend/database";

const addPelletSchema = z.object({
  id: z.string(),
  targetLicensePlate: z.string(),
  createdBy: z.string(),
  createdAt: z.number(),
  reason: z.string(),
  type: z.enum(['negative', 'positive']),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

export const addPelletRoute = protectedProcedure
  .input(addPelletSchema)
  .mutation(async ({ ctx, input }) => {
    console.log('[Pellet] Adding pellet:', {
      user: ctx.userEmail,
      target: input.targetLicensePlate,
      type: input.type,
    });
    
    try {
      console.log('[Pellet] Ensuring database is initialized...');
      await initDatabase();
      
      console.log('[Pellet] Creating pellet in database...');
      await createPellet(input);
      
      console.log('[Pellet] Logging user activity...');
      await logUserActivity(ctx.userId!, 'pellet_created', {
        pelletId: input.id,
        targetLicensePlate: input.targetLicensePlate,
        type: input.type,
      });
      
      console.log('[Pellet] Pellet added successfully:', input.id);
      
      return {
        success: true,
        message: 'Pellet added successfully',
        pelletId: input.id,
      };
    } catch (error: any) {
      console.error('[Pellet] Error adding pellet:', error);
      console.error('[Pellet] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      throw new Error(`Failed to add pellet: ${error?.message || 'Unknown error'}`);
    }
  });

export default addPelletRoute;
