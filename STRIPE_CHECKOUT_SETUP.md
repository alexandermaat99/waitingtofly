# Stripe Checkout Session Setup Guide

This guide will help you migrate from Payment Intents to Stripe Checkout Sessions to enable **Stripe Tax** automatic tax calculation.

## ✅ What's Changed

- **New API Route**: `/api/create-checkout-session` (replaces `/api/create-payment-intent`)
- **Updated Frontend**: Now redirects to Stripe Checkout instead of embedded payment form
- **Updated Webhook**: Handles `checkout.session.completed` events
- **Stripe Tax Enabled**: Automatic tax calculation using Stripe Tax

## 📋 Setup Steps

### 1. Run Database Migration

Add the `checkout_session_id` column to your orders table:

```bash
# Run this SQL migration
psql your_database < add-checkout-session-id.sql
```

Or run it directly in your Supabase SQL editor:

```sql
-- Add checkout_session_id column to orders table for Stripe Checkout Sessions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_session_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session_id ON orders(checkout_session_id);
```

### 2. Environment Variables

Ensure you have these environment variables set:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL for redirects (production: your domain, dev: http://localhost:3000)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # For development
# NEXT_PUBLIC_BASE_URL=https://yourdomain.com  # For production
```

### 3. Enable Stripe Tax in Dashboard

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/settings/tax
2. **Click "Get started"** or **"Activate"** Stripe Tax
3. **Complete the setup wizard**:
   - Set your **origin address** (business location)
   - Choose a **default product tax code**
   - Configure whether prices include tax
4. **Add Tax Registrations**:
   - Go to "Registrations" tab
   - Add registrations for regions where you need to collect tax
   - Stripe will suggest regions based on your sales

### 4. Configure Webhook Endpoint

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/webhooks
2. **Add endpoint** (or update existing): `https://yourdomain.com/api/webhooks/stripe`
3. **Select events to listen for**:
   - `checkout.session.completed` ✅ (required - NEW)
   - `payment_intent.succeeded` (optional - for backwards compatibility)
   - `payment_intent.payment_failed` (optional)
4. **Copy the webhook signing secret** to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### 5. Test the Integration

1. **Test Mode**: Make sure you're using test API keys (`sk_test_...`)
2. **Create a test order**:
   - Go to your checkout page
   - Fill in shipping information
   - Click "Continue to Payment"
   - You should be redirected to Stripe Checkout
3. **Use test card**: `4242 4242 4242 4242`
4. **Complete payment**:
   - You'll be redirected back to `/order-success`
   - Check your webhook logs in Stripe Dashboard
   - Verify order is marked as "completed" in your database

## 🔍 How It Works

### Checkout Flow

1. **User clicks "Continue to Payment"**
   - Frontend calls `/api/create-checkout-session`
   - Order is created in database with status "pending"

2. **Redirect to Stripe Checkout**
   - User is redirected to Stripe's hosted checkout page
   - Stripe Tax automatically calculates tax based on shipping address
   - User enters payment information

3. **Payment Success**
   - Stripe redirects to `/order-success?session_id=xxx`
   - Stripe sends webhook event `checkout.session.completed`
   - Webhook updates order with:
     - Final tax amount (from Stripe Tax)
     - Subtotal and total
     - Status: "completed"

### Tax Calculation

- **Stripe Tax** automatically calculates tax based on:
  - Customer's shipping address
  - Product tax code (set in checkout session)
  - Tax registrations in your Stripe account
  - Current tax rates for that jurisdiction

- **Tax is displayed** to the customer during checkout
- **Tax amount is stored** in the database after payment completes

## 🐛 Troubleshooting

### "automatic_tax not working"

- ✅ **Check Stripe Tax is activated** in Dashboard → Settings → Tax
- ✅ **Verify tax registrations** are set up for relevant regions
- ✅ **Check webhook events** are being received
- ✅ **Review server logs** for webhook processing errors

### "Checkout session not redirecting"

- ✅ **Check `NEXT_PUBLIC_BASE_URL`** is set correctly
- ✅ **Verify API route** `/api/create-checkout-session` is working
- ✅ **Check browser console** for JavaScript errors

### "Order not updating after payment"

- ✅ **Verify webhook endpoint** is configured correctly
- ✅ **Check webhook secret** matches your `.env` file
- ✅ **Review webhook logs** in Stripe Dashboard
- ✅ **Check database** - verify `checkout_session_id` column exists

## 📝 Notes

- **Payment Intents still work**: The webhook handles both old Payment Intents and new Checkout Sessions
- **Tax calculation happens on Stripe**: No need for manual tax calculation anymore
- **Shipping address is collected**: Required for accurate tax calculation
- **Promotion codes**: Enabled by default in checkout sessions

## 🚀 Next Steps

1. Run the database migration
2. Update environment variables
3. Enable Stripe Tax in dashboard
4. Configure webhook endpoint
5. Test with a test order
6. Monitor webhook logs

After testing in test mode, switch to **live mode** and update your keys accordingly!

