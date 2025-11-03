# 🚀 Live Deployment Checklist

## ✅ Configuration Changes for Production

### 1. Environment Variables to Update

Update these environment variables in your deployment platform (Vercel, Netlify, etc.):

#### Stripe Keys (Switch from Test to Live)
```bash
# OLD (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NEW (Live Mode) - Get these from Stripe Dashboard
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Supabase Keys
```bash
# These should already be set correctly
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
```

#### Base URL
```bash
# Set your production domain
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 2. Stripe Dashboard Configuration

#### A. Switch to Live Mode
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Toggle from "Test Mode" to "Live Mode"** (top right of the dashboard)

#### B. Enable Stripe Tax (if not already done)
1. Navigate to: **Settings → Tax**
2. Click **"Enable Tax"** or **"Activate"**
3. Complete setup wizard:
   - Set your **business origin address** (where you ship from)
   - Choose default product tax code:
     - Physical books: `txcd_99999999` (General tangible personal property)
     - Digital products: `txcd_31000000` (Digital products)
4. Add **Tax Registrations** for regions where you collect tax

#### C. Update Webhook Endpoint
1. Go to: **Developers → Webhooks**
2. **Add new endpoint** for live mode: `https://yourdomain.com/api/webhooks/stripe`
3. **Select events**:
   - ✅ `checkout.session.completed` (required)
   - ✅ `payment_intent.succeeded` (optional, for backwards compatibility)
   - ✅ `payment_intent.payment_failed` (optional)
4. **Copy the webhook signing secret** (starts with `whsec_...`)
5. **Update `STRIPE_WEBHOOK_SECRET`** in your environment variables

#### D. Get Your Live API Keys
1. Go to: **Developers → API keys**
2. **Copy the "Secret key"** (starts with `sk_live_...`)
   - Update `STRIPE_SECRET_KEY` in your env vars
3. **Copy the "Publishable key"** (starts with `pk_live_...`)
   - Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in your env vars

### 3. Supabase Configuration

Ensure your production Supabase database has all necessary tables and policies:

#### Database Schema
Run these SQL scripts in order (if not already done):
1. `database-schema.sql` - Main orders table
2. `site-config-schema.sql` - Site configuration
3. `mailing-list-schema.sql` - Mailing list
4. `admin-schema.sql` - Admin users
5. `add-checkout-session-id.sql` - Checkout session tracking
6. `add-shipping-columns.sql` - Shipping address fields
7. `add-shipping-price.sql` - Shipping cost
8. `add-quantity-column.sql` - Order quantity
9. `add-bundle-format.sql` - Bundle product type
10. `enable-rls-policies.sql` - Row Level Security
11. `update-active-site-config-view.sql` - Site config view

#### Row Level Security
Ensure RLS is enabled on all tables with proper policies:
- Orders table: Users can only see their own orders
- Admin access: Only super admins can access admin dashboard
- Site config: Public read, admin write

### 4. Deployment Checklist

#### Vercel Deployment
1. **Push your code** to your main branch
2. **Add environment variables** in Vercel dashboard:
   - Go to: Project Settings → Environment Variables
   - Add all the variables from Step 1 above
   - Make sure to select **Production** environment
3. **Deploy**
   - Automatic if connected to Git
   - Or manually trigger: `vercel --prod`

#### Post-Deployment Verification
1. ✅ Check webhook is accessible: `https://yourdomain.com/api/test-webhook`
2. ✅ Test a real order with a small amount first
3. ✅ Verify webhook receives events in Stripe Dashboard → Webhooks → [Your endpoint] → Recent events
4. ✅ Check order appears in your database with correct status
5. ✅ Verify email notifications work (if implemented)

### 5. Testing Checklist

**Important:** Test with small amounts first!

1. **Create a test order** with a real payment method
2. **Monitor Stripe Dashboard**:
   - Payment should show in **Payments** tab
   - Tax should be calculated and displayed
   - Checkout session should show automatic tax enabled
3. **Monitor Supabase**:
   - Order should be created with status "pending"
   - After payment, order should update to status "completed"
   - Tax amounts should be populated
4. **Check Webhook Logs**:
   - Go to Stripe Dashboard → Webhooks → [Your endpoint]
   - Should see successful `checkout.session.completed` events
   - No red errors

### 6. Security Reminders

- ✅ **Never commit** `.env` files or API keys to Git
- ✅ **Use environment variables** for all sensitive data
- ✅ **Enable HTTPS** (automatic with Vercel)
- ✅ **Keep Stripe secret keys** server-side only
- ✅ **Review RLS policies** regularly
- ✅ **Monitor webhook signatures** (already implemented)

### 7. Monitoring & Alerts

Set up monitoring for:
- Failed payment webhooks
- Failed order creations
- Stripe API errors
- Database connection issues

Consider setting up:
- Stripe webhook monitoring dashboard
- Supabase alerting
- Error tracking (Sentry, etc.)

### 8. Common Issues & Solutions

#### Issue: Webhook not receiving events
**Solution:**
- Verify webhook URL is correct and accessible
- Check `STRIPE_WEBHOOK_SECRET` matches the signing secret from dashboard
- Test webhook endpoint: `curl https://yourdomain.com/api/test-webhook`

#### Issue: Tax not calculating
**Solution:**
- Verify Stripe Tax is enabled in live mode
- Check tax registrations are set up
- Ensure shipping address is being collected
- Verify product tax codes are correct in code

#### Issue: Orders not updating after payment
**Solution:**
- Check webhook logs in Stripe Dashboard
- Verify `checkout_session_id` column exists in orders table
- Check Supabase logs for database errors
- Ensure RLS policies allow updates

#### Issue: "Invalid signature" webhook errors
**Solution:**
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Ensure you're using the signing secret from the correct webhook endpoint
- Check you're testing with the correct mode (test vs live)

### 9. Post-Launch Tasks

1. **Set up Stripe Tax reporting** to monitor tax collection
2. **Configure email notifications** for order confirmations
3. **Set up admin dashboard** monitoring
4. **Review analytics** in Stripe Dashboard
5. **Test payment flows** from different locations
6. **Monitor for fraud** in Stripe Dashboard

### 10. Rollback Plan

If something goes wrong:
1. Switch back to test mode in Stripe Dashboard
2. Update environment variables to use test keys
3. Redeploy
4. Investigate issue in test mode
5. Fix and re-deploy to production

---

## 📋 Quick Reference

### Environment Variables Needed
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Stripe Dashboard URLs
- Dashboard: https://dashboard.stripe.com/
- Webhooks: https://dashboard.stripe.com/webhooks
- API Keys: https://dashboard.stripe.com/apikeys
- Tax Settings: https://dashboard.stripe.com/settings/tax
- Payments: https://dashboard.stripe.com/payments

### Testing Checklist
- [ ] Stripe Tax enabled in live mode
- [ ] Webhook endpoint configured
- [ ] Test order with real payment succeeds
- [ ] Tax calculated correctly
- [ ] Order updates in database
- [ ] No webhook errors
- [ ] Email notifications work

---

Good luck with your launch! 🎉

