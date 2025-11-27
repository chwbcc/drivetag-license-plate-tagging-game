# PayPal Integration Setup Guide

## Overview
Your app now has PayPal payment integration for purchasing pellets, erasing pellets, and accepting donations.

## Required Configuration

### 1. Get PayPal Credentials

#### For Testing (Sandbox):
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Log in with your PayPal account
3. Go to "Apps & Credentials"
4. Under "Sandbox", create a new app or use an existing one
5. Copy your:
   - **Client ID** (shown publicly)
   - **Secret** (click "Show" to reveal)

#### For Production:
1. Switch to "Live" tab in Apps & Credentials
2. Create a production app
3. Copy production credentials

### 2. Configure Environment Variables

Add these environment variables to your project:

```bash
# For Sandbox (Testing)
EXPO_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_secret_here
EXPO_PUBLIC_PAYPAL_MODE=sandbox

# For Production (Live)
# EXPO_PUBLIC_PAYPAL_CLIENT_ID=your_production_client_id_here
# PAYPAL_CLIENT_SECRET=your_production_secret_here
# EXPO_PUBLIC_PAYPAL_MODE=production
```

**Important Security Notes:**
- `EXPO_PUBLIC_*` variables are visible in the client (safe for Client ID)
- `PAYPAL_CLIENT_SECRET` is server-only and must NEVER be exposed to the client
- Never commit secrets to your repository

### 3. How It Works

1. **User clicks "Buy" button** → Creates PayPal order via backend
2. **Opens PayPal payment page** → User completes payment
3. **Payment callback** → Backend captures the payment
4. **Success** → Pellets are added to user account

### 4. Payment Flow

```
Shop Screen → Create Order (Backend) → PayPal Website → 
User Pays → Return to App → Capture Payment (Backend) → 
Update User Balance
```

### 5. Testing with Sandbox

1. Set `EXPO_PUBLIC_PAYPAL_MODE=sandbox`
2. Use sandbox credentials
3. Test payments using PayPal sandbox test accounts:
   - Create test accounts at: https://developer.paypal.com/dashboard/accounts
   - Use test buyer accounts to make payments

### 6. Going Live

When ready for production:

1. Get your business account approved by PayPal
2. Switch to production credentials
3. Change `EXPO_PUBLIC_PAYPAL_MODE=production`
4. Test with small real transactions first

### 7. Webhook Configuration (Optional but Recommended)

For production, set up webhooks to receive payment notifications:

1. In PayPal Dashboard → Webhooks
2. Add webhook URL: `https://your-backend-url.com/api/webhooks/paypal`
3. Subscribe to events:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.REFUNDED`

### 8. Mobile App Considerations

- On mobile, payments open in the device browser
- User completes payment and returns to app
- Deep linking handles the return flow
- Web version opens PayPal in a new tab

## Troubleshooting

### "PayPal credentials not configured" error
- Make sure environment variables are set correctly
- Restart your development server after adding variables

### Payment fails immediately
- Check if you're using sandbox credentials with sandbox mode
- Verify Client ID and Secret are correct
- Check backend logs for detailed errors

### Payment page doesn't open
- Ensure device can open URLs
- Check if PayPal is accessible in your region
- Verify approval URL is being returned from backend

## Support

For PayPal API issues, refer to:
- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal API Reference](https://developer.paypal.com/api/rest/)

## Files Modified

- `backend/trpc/routes/payment/create-order/route.ts` - Creates PayPal orders
- `backend/trpc/routes/payment/capture-order/route.ts` - Captures payments
- `app/(tabs)/shop.tsx` - Shop UI with PayPal integration
- `backend/trpc/app-router.ts` - Added payment routes
