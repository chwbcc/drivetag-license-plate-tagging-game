import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADMIN_EMAILS = ["chwbcc@gmail.com"];

export const getUsersProcedure = publicProcedure
  .input(z.object({ adminEmail: z.string().email() }))
  .query(async ({ input }) => {
    if (!ADMIN_EMAILS.includes(input.adminEmail.toLowerCase())) {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      const authStorageData = await AsyncStorage.getItem("auth-storage");
      const pelletStorageData = await AsyncStorage.getItem("pellet-storage");
      const badgeStorageData = await AsyncStorage.getItem("badge-storage");
      const paymentStorageData = await AsyncStorage.getItem("payment-storage");

      const authData = authStorageData ? JSON.parse(authStorageData) : null;
      const pelletData = pelletStorageData ? JSON.parse(pelletStorageData) : null;
      const badgeData = badgeStorageData ? JSON.parse(badgeStorageData) : null;
      const paymentData = paymentStorageData ? JSON.parse(paymentStorageData) : null;

      const currentUser = authData?.state?.user || null;
      const allPellets = pelletData?.state?.pellets || [];
      const allBadges = badgeData?.state?.badges || [];
      const purchaseHistory = paymentData?.state?.purchaseHistory || [];

      const users = currentUser ? [currentUser] : [];

      return {
        users,
        pellets: allPellets,
        badges: allBadges,
        purchases: purchaseHistory,
      };
    } catch (error) {
      console.error("Error fetching admin data:", error);
      throw new Error("Failed to fetch user data");
    }
  });
