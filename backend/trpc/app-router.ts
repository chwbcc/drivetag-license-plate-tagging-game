import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import createOrderProcedure from "./routes/payment/create-order/route";
import captureOrderProcedure from "./routes/payment/capture-order/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  payment: createTRPCRouter({
    createOrder: createOrderProcedure,
    captureOrder: captureOrderProcedure,
  }),
});

export type AppRouter = typeof appRouter;
