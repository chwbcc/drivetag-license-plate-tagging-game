import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const PAYPAL_API = process.env.EXPO_PUBLIC_PAYPAL_MODE === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export const captureOrderProcedure = publicProcedure
  .input(
    z.object({
      orderId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(
        `${PAYPAL_API}/v2/checkout/orders/${input.orderId}/capture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const capture = await response.json();
      
      if (!response.ok) {
        console.error('PayPal order capture failed:', capture);
        throw new Error(capture.message || 'Failed to capture PayPal order');
      }

      return {
        success: true,
        captureId: capture.id,
        status: capture.status,
      };
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      throw new Error('Failed to capture payment');
    }
  });

export default captureOrderProcedure;
