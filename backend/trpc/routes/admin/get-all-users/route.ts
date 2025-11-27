import { adminProcedure } from "../../../create-context";
import { User } from "@/types";

export const getAllUsersRoute = adminProcedure.query(async ({ ctx }) => {
  console.log('Admin accessing all users:', ctx.userEmail);
  
  return {
    message: "This is a mock endpoint. In production, this would query the database for all users.",
    users: [] as User[],
  };
});

export default getAllUsersRoute;
