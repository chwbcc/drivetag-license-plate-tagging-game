import { protectedProcedure } from "../../../create-context";
import { z } from "zod";
import { getPelletsByLicensePlate } from "@/backend/services/pellet-service";
import { initDatabase } from "@/backend/database";

const getPelletsSchema = z.object({
  licensePlate: z.string(),
  type: z.enum(['negative', 'positive']).optional(),
});

export const getPelletsRoute = protectedProcedure
  .input(getPelletsSchema)
  .query(async ({ ctx, input }) => {
    console.log('[Pellet] Getting pellets:', {
      user: ctx.userEmail,
      licensePlate: input.licensePlate,
      type: input.type,
    });
    
    try {
      await initDatabase();
      
      const pellets = await getPelletsByLicensePlate(input.licensePlate, input.type);
      
      console.log(`[Pellet] Found ${pellets.length} pellets for ${input.licensePlate}`);
      
      return {
        pellets,
        count: pellets.length,
      };
    } catch (error) {
      console.error('[Pellet] Error getting pellets:', error);
      throw new Error('Failed to get pellets');
    }
  });

export default getPelletsRoute;
