import { adminProcedure } from "../../../create-context";
import { z } from "zod";

const getUserActivitySchema = z.object({
  userId: z.string(),
});

export const getUserActivityRoute = adminProcedure
  .input(getUserActivitySchema)
  .query(async ({ ctx, input }) => {
    console.log('Admin accessing user activity:', {
      admin: ctx.userEmail,
      targetUserId: input.userId,
    });
    
    return {
      message: "This is a mock endpoint. In production, this would query the database for user activity.",
      userId: input.userId,
      activity: [],
    };
  });

export default getUserActivityRoute;
