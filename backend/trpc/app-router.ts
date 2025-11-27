import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import createOrderProcedure from "./routes/payment/create-order/route";
import captureOrderProcedure from "./routes/payment/capture-order/route";
import getAllUsersRoute from "./routes/admin/get-all-users/route";
import getAllPelletsRoute from "./routes/admin/get-all-pellets/route";
import updateUserRoleRoute from "./routes/admin/update-user-role/route";
import getUserActivityRoute from "./routes/admin/get-user-activity/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  payment: createTRPCRouter({
    createOrder: createOrderProcedure,
    captureOrder: captureOrderProcedure,
  }),
  admin: createTRPCRouter({
    getAllUsers: getAllUsersRoute,
    getAllPellets: getAllPelletsRoute,
    updateUserRole: updateUserRoleRoute,
    getUserActivity: getUserActivityRoute,
  }),
});

export type AppRouter = typeof appRouter;
