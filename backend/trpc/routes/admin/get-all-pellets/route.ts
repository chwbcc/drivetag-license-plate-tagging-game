import { adminProcedure } from "../../../create-context";
import { Pellet } from "@/types";

export const getAllPelletsRoute = adminProcedure.query(async ({ ctx }) => {
  console.log('Admin accessing all pellets:', ctx.userEmail);
  
  return {
    message: "This is a mock endpoint. In production, this would query the database for all pellets.",
    pellets: [] as Pellet[],
  };
});

export default getAllPelletsRoute;
