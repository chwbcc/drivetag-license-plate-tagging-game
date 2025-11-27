import { publicProcedure } from "../../../create-context";
import { z } from "zod";

const ADMIN_EMAILS = ["chwbcc@gmail.com"];

export const checkAdminProcedure = publicProcedure
  .input(z.object({ email: z.string().email() }))
  .query(({ input }) => {
    const isAdmin = ADMIN_EMAILS.includes(input.email.toLowerCase());
    return { isAdmin };
  });
