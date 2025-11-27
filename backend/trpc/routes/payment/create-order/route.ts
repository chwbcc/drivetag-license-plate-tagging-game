import { z } from "zod";
import { publicProcedure } from "../../../create-context";

const PAYPAL_API = process.env.EXPO_PUBLIC_PAYPAL_MODE === 'production' 
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  console.log('PayPal Configuration Check:');
  console.log('- Client ID exists:', !!clientId);
  console.log('- Client ID (first 10 chars):', clientId?.substring(0, 10));
  console.log('- Client Secret exists:', !!clientSecret);
  console.log('- PayPal Mode:', process.env.EXPO_PUBLIC_PAYPAL_MODE || 'sandbox (default)');
  console.log('- API URL:', PAYPAL_API);
  
  if (!clientId || !clientSecret) {
    console.error('Missing PayPal credentials!');
    console.error('EXPO_PUBLIC_PAYPAL_CLIENT_ID:', clientId ? 'SET' : 'NOT SET');
    console.error('PAYPAL_CLIENT_SECRET:', clientSecret ? 'SET' : 'NOT SET');
    throw new Error('PayPal credentials not configured. Please check your environment variables.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  console.log('Requesting PayPal access token...');
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('PayPal token request failed:', response.status, data);
    throw new Error(`Failed to get PayPal access token: ${data.error_description || data.error || 'Unknown error'}`);
  }
  
  console.log('PayPal access token obtained successfully');
  return data.access_token;
}

export const createOrderProcedure = publicProcedure
  .input(
    z.object({
      itemId: z.string(),
      amount: z.number(),
      itemName: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: input.itemId,
              description: input.itemName,
              amount: {
                currency_code: 'USD',
                value: input.amount.toFixed(2),
              },
            },
          ],
          application_context: {
            return_url: `${process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://rork.app'}/payment-success`,
            cancel_url: `${process.env.EXPO_PUBLIC_TOOLKIT_URL || 'https://rork.app'}/payment-cancel`,
            brand_name: 'Stupid Pellets',
            user_action: 'PAY_NOW',
          },
        }),
      });

      const order = await response.json();
      
      if (!response.ok) {
        console.error('PayPal order creation failed:', order);
        throw new Error(order.message || 'Failed to create PayPal order');
      }

      return { 
        orderId: order.id,
        approvalUrl: order.links?.find((link: any) => link.rel === 'approve')?.href,
      };
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw new Error('Failed to create payment order');
    }
  });

export default createOrderProcedure;
