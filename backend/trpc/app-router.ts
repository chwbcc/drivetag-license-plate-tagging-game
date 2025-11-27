import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import createOrderProcedure from "./routes/payment/create-order/route";
import captureOrderProcedure from "./routes/payment/capture-order/route";
import { checkAdminProcedure } from "./routes/admin/check-admin/route";
import { getUsersProcedure } from "./routes/admin/get-users/route";
import { getStatsProcedure } from "./routes/admin/get-stats/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  payment: createTRPCRouter({
    createOrder: createOrderProcedure,
    captureOrder: captureOrderProcedure,
  }),
  admin: createTRPCRouter({
    checkAdmin: checkAdminProcedure,
    getUsers: getUsersProcedure,
    getStats: getStatsProcedure,
  }),
});

export type AppRouter = typeof appRouter;
