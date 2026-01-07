import { createTRPCRouter, publicProcedure } from "./create-context";
import { z } from "zod";
import * as userService from '../services/user-service';
import * as pelletService from '../services/pellet-service';

export const appRouter = createTRPCRouter({
  deleteUser: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await userService.deleteUser(input.userId);
      return { success: true };
    }),
  
  getPelletsByLicensePlate: publicProcedure
    .input(z.object({
      licensePlate: z.string(),
      type: z.enum(['negative', 'positive']).optional(),
    }))
    .query(async ({ input }) => {
      return await pelletService.getPelletsByLicensePlate(input.licensePlate, input.type);
    }),
  
  getPelletsCreatedByUser: publicProcedure
    .input(z.object({
      userId: z.string(),
      type: z.enum(['negative', 'positive']).optional(),
    }))
    .query(async ({ input }) => {
      return await pelletService.getPelletsCreatedByUser(input.userId, input.type);
    }),
});

export type AppRouter = typeof appRouter;
