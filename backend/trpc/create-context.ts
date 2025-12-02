import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { AdminRole } from "@/types";
import { getDatabase } from "../database";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  try {
    getDatabase();
  } catch (error) {
    console.error('[tRPC Context] Database not available:', error);
  }
  
  const userJson = opts.req.headers.get('x-user-data');
  
  let userId: string | null = null;
  let userEmail: string | null = null;
  let adminRole: AdminRole = null;
  
  if (userJson) {
    try {
      const userData = JSON.parse(userJson);
      userId = userData.id || null;
      userEmail = userData.email || null;
      adminRole = userData.adminRole || null;
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }
  }
  
  return {
    req: opts.req,
    userId,
    userEmail,
    adminRole,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  });
});

const isAdmin = t.middleware(({ next, ctx }) => {
  if (!ctx.userId || !ctx.adminRole) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Admin access required' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      adminRole: ctx.adminRole,
    },
  });
});

const isSuperAdmin = t.middleware(({ next, ctx }) => {
  if (!ctx.userId || ctx.adminRole !== 'super_admin') {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Super admin access required' });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      adminRole: ctx.adminRole,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
export const superAdminProcedure = t.procedure.use(isSuperAdmin);
