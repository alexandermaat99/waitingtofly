# ⚡ Quick Start: Going Live with Stripe

## The 5 Essential Steps

### 1. Update Stripe Keys (3 minutes)
Get your live keys from [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys):

```bash
# In your deployment platform (Vercel, etc.), update:
STRIPE_SECRET_KEY=sk_live_YOUR_KEY_HERE  # Was: sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE  # Was: pk_test_...
```

### 2. Enable Stripe Tax (5 minutes)
1. Go to [Stripe Dashboard → Tax Settings](https://dashboard.stripe.com/settings/tax)
2. Toggle to **Live Mode** (top right)
3. Click **"Enable Tax"**
4. Set your business address
5. Add tax registrations for your regions

### 3. Configure Webhook (5 minutes)
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded` (optional)
   - ✅ `payment_intent.payment_failed` (optional)
5. Copy webhook secret (starts with `whsec_...`)

```bash
# Add to your environment variables:
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

### 4. Set Base URL (1 minute)
```bash
# Add/update in your environment variables:
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### 5. Deploy & Test (5 minutes)
1. **Deploy** your app (push to main branch or `vercel --prod`)
2. **Test** webhook: Visit `https://yourdomain.com/api/test-webhook`
3. **Place test order** with a small amount using a real card
4. **Verify**:
   - Payment appears in Stripe Dashboard → Payments
   - Order appears in your database
   - Tax is calculated
   - Webhook logs show no errors

---

## ✅ All Environment Variables

Copy-paste these into your deployment platform:

```bash
# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Your production domain
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Supabase (keep existing values)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key
```

---

## 🚨 Most Common Mistakes

1. **Forgot to toggle to Live Mode** in Stripe Dashboard
2. **Using test webhook secret** with live keys (or vice versa)
3. **Webhook URL has typo** - double-check `https://yourdomain.com/api/webhooks/stripe`
4. **NEXT_PUBLIC_BASE_URL missing or wrong** - must be your production domain
5. **Database tables missing** - ensure all SQL migrations are run in production Supabase


---

## 🔗 Important Links

- [Stripe Live Dashboard](https://dashboard.stripe.com/)
- [Your Webhooks](https://dashboard.stripe.com/webhooks)
- [Your API Keys](https://dashboard.stripe.com/apikeys)
- [Tax Settings](https://dashboard.stripe.com/settings/tax)
- [Recent Payments](https://dashboard.stripe.com/payments)

---

## 📞 Need Help?

See `LIVE_DEPLOYMENT_CHECKLIST.md` for detailed troubleshooting.

