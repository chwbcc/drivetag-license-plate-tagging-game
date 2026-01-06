import { createTRPCRouter, publicProcedure } from "./create-context";
import { z } from "zod";
import * as userService from '../services/user-service';

export const appRouter = createTRPCRouter({
  deleteUser: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      await userService.deleteUser(input.userId);
      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;
