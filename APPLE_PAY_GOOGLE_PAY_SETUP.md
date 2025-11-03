# Apple Pay & Google Pay Setup Guide for Production (Vercel)

This guide covers all the steps needed to enable Apple Pay and Google Pay in production on Vercel.

## Step 1: Stripe Dashboard Configuration

### Enable Payment Methods
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** → **Payment methods**
3. Enable:
   - ✅ **Apple Pay**
   - ✅ **Google Pay**

### Configure Apple Pay Domain
1. In Stripe Dashboard, go to **Settings** → **Payment methods** → **Apple Pay**
2. Click **"Configure domains"**
3. Click **"Add domain"**
4. Enter your production domain (e.g., `yourdomain.com` or `www.yourdomain.com`)
   - Add both `yourdomain.com` AND `www.yourdomain.com` if you use both
5. Stripe will generate a domain association file
6. **Download or copy the file content** - you'll need this in Step 2

## Step 2: Deploy Domain Association File to Vercel

### Option A: Using the API Route (Recommended)
1. Open `app/.well-known/apple-developer-merchantid-domain-association/route.ts`
2. Replace the placeholder content with the actual file content from Stripe Dashboard
3. The file content should look like:
   ```
   -----BEGIN CERTIFICATE-----
   [certificate content]
   -----END CERTIFICATE-----
   ```
4. Commit and push to deploy

### Option B: Using Static File
1. Create directory: `public/.well-known/apple-developer-merchantid-domain-association`
2. Create a file with the content from Stripe Dashboard
3. Note: This might not work on Vercel without proper rewrites

### Verify Domain Association File is Accessible
After deploying, verify the file is accessible:
```
https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
```
Should return the certificate content, not a 404.

## Step 3: Complete Domain Verification in Stripe

1. Go back to Stripe Dashboard → Apple Pay → Configure domains
2. Click **"Verify"** next to your domain
3. Stripe will check if the file is accessible
4. Wait for verification (usually takes a few minutes)
5. Status should change to "Verified" ✅

## Step 4: Environment Variables

Ensure these are set in Vercel:

### Production Environment:
- `STRIPE_SECRET_KEY` - Your live Stripe secret key (starts with `sk_live_`)
- `STRIPE_PUBLISHABLE_KEY` - Your live Stripe publishable key (starts with `pk_live_`)
- `STRIPE_WEBHOOK_SECRET` - Your production webhook secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Same as publishable key (for client-side)

### Update .env or Vercel Dashboard:
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 5: Webhook Configuration

### Production Webhook:
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the **Signing secret** and add to `STRIPE_WEBHOOK_SECRET` in Vercel

## Step 6: Test on Production

### Apple Pay Testing:
- Use **real iPhone/iPad** or **Mac with Safari**
- Must have a card in Apple Wallet
- Must be signed into iCloud
- Visit your production site (not localhost)
- Should see Apple Pay button in payment form

### Google Pay Testing:
- Use **Android device with Chrome** or **Chrome on desktop**
- Must have a card saved in Google Pay
- Must be signed into Google account
- Visit your production site
- Should see Google Pay button in payment form

### Test Cards:
Use Stripe's test cards in **test mode**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

**Note:** Apple Pay and Google Pay only work in **live mode** with real cards in production. Test mode won't show these options.

## Step 7: Verification Checklist

✅ Apple Pay enabled in Stripe Dashboard
✅ Google Pay enabled in Stripe Dashboard  
✅ Domain added and verified in Stripe Dashboard
✅ Domain association file accessible at correct URL
✅ Production environment variables set in Vercel
✅ Production webhook configured
✅ Site deployed to production
✅ Testing on supported devices

## Troubleshooting

### Apple Pay/Google Pay not showing:
1. **Check domain verification** - Must show "Verified" in Stripe Dashboard
2. **Check device/browser** - Must be Safari (iOS/Mac) or Chrome (Android)
3. **Check cards in wallet** - User must have cards saved
4. **Check HTTPS** - Must use HTTPS in production
5. **Check browser console** - Look for any Stripe errors
6. **Verify environment** - Make sure using production keys, not test keys

### Domain verification failing:
1. Ensure file is accessible (no 404)
2. Check file content matches exactly what Stripe provided
3. Clear browser cache and retry
4. Wait a few minutes - verification can take time

### Still not working?
- Check Stripe Dashboard → Events → Webhooks for any errors
- Verify production environment variables in Vercel
- Test with a real card in Apple Wallet/Google Pay
- Ensure you're not in test mode when expecting wallets

## Additional Resources

- [Stripe Apple Pay Setup](https://stripe.com/docs/stripe-js/elements/payment-request-button)
- [Stripe Google Pay Setup](https://stripe.com/docs/stripe-js/elements/payment-request-button)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

