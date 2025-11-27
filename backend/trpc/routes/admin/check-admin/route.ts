import { publicProcedure } from "../../../create-context";
import { z } from "zod";

const ADMIN_EMAILS = ["chwbcc@gmail.com"];

export const checkAdminProcedure = publicProcedure
  .input(z.object({ email: z.string().email() }))
  .query(({ input }) => {
    const normalizedEmail = input.email.toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(normalizedEmail);
    console.log('Admin check:', { inputEmail: input.email, normalizedEmail, isAdmin, adminEmails: ADMIN_EMAILS });
    return { isAdmin };
  });
