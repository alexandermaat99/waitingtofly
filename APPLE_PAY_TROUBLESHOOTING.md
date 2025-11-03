# Apple Pay Troubleshooting Guide

## Quick Checklist

### 1. Domain Association File Accessibility ✅
Test if the file is accessible:
```
https://www.waitingtoflymemoir.com/.well-known/apple-developer-merchantid-domain-association
```

**Expected:** Should return `merchant.com.waitingtoflymemoir` (plain text)
**If 404:** The route isn't deployed or accessible
**If wrong content:** File content needs to be updated

### 2. Stripe Dashboard Verification ✅
1. Go to: https://dashboard.stripe.com/settings/payments/apple_pay
2. Find your domain in the list
3. Check status:
   - ✅ **"Verified"** - Domain is properly set up
   - ⚠️ **"Pending"** - Still verifying (wait a few minutes)
   - ❌ **"Failed"** - File not accessible or wrong content

### 3. Device & Browser Requirements ✅
- **Browser:** Safari ONLY (iOS Safari or macOS Safari)
- **Device:** 
  - iPhone/iPad with iOS 10+
  - Mac with macOS Sierra+ and Safari
- **Wallet:** Must have at least one card in Apple Wallet
- **Environment:** Production (HTTPS), NOT localhost

### 4. Code Configuration ✅
Already configured in `components/preorder-form-with-payment.tsx`:
```typescript
wallets: {
  applePay: 'auto',
  googlePay: 'auto',
}
```

### 5. Payment Intent Configuration ✅
Already configured in `app/api/create-payment-intent/route.ts`:
```typescript
automatic_payment_methods: {
  enabled: true,
  allow_redirects: 'always',
}
```

## Common Issues & Solutions

### Issue: Apple Pay button not appearing
**Possible causes:**
1. Domain not verified in Stripe Dashboard
2. Testing on wrong browser (not Safari)
3. No card in Apple Wallet
4. Testing on localhost instead of production
5. Domain association file not accessible

**Solution:**
- Verify domain in Stripe Dashboard shows "Verified"
- Test on Safari (iOS or macOS)
- Ensure card is in Apple Wallet
- Test on production URL (HTTPS)

### Issue: Domain verification failing
**Possible causes:**
1. File not accessible at correct URL
2. File content is incorrect
3. Server blocking `.well-known` directory
4. CORS or security headers blocking access

**Solution:**
- Verify file is accessible: `https://www.waitingtoflymemoir.com/.well-known/apple-developer-merchantid-domain-association`
- Check file returns correct content: `merchant.com.waitingtoflymemoir`
- Check browser console for any errors
- Verify Stripe can access the file (they check automatically)

### Issue: File returns 404
**Solution:**
- Verify route exists: `app/.well-known/apple-developer-merchantid-domain-association/route.ts`
- Check if deployed to production
- Verify Vercel is serving the route correctly

## Testing Steps

1. **Verify file is accessible:**
   ```bash
   curl https://www.waitingtoflymemoir.com/.well-known/apple-developer-merchantid-domain-association
   ```
   Should return: `merchant.com.waitingtoflymemoir`

2. **Check Stripe Dashboard:**
   - Domain should show as "Verified"
   - If not verified, click "Verify" button

3. **Test on device:**
   - Open Safari on iPhone/iPad with card in Apple Wallet
   - Visit: https://www.waitingtoflymemoir.com/checkout
   - Complete checkout steps to reach payment
   - Apple Pay button should appear if all conditions met

4. **Check browser console:**
   - Open Safari Developer Tools (on Mac) or Safari Web Inspector
   - Look for any Stripe errors
   - Look for any Apple Pay related errors

## Still Not Working?

If Apple Pay still doesn't appear after checking all above:

1. **Contact Stripe Support:**
   - They can check your account configuration
   - They can verify domain setup from their side
   - They can check for any account-level issues

2. **Check Stripe Logs:**
   - Go to Stripe Dashboard → Developers → Logs
   - Look for any errors related to Apple Pay

3. **Verify Environment Variables:**
   - `STRIPE_SECRET_KEY` - Should be live key (sk_live_...)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Should be live key (pk_live_...)

4. **Test with Stripe Test Mode:**
   - Note: Apple Pay doesn't work in test mode
   - Must use live mode with real cards

## Additional Notes

- The domain association file content (`merchant.com.waitingtoflymemoir`) is correct for Stripe
- The code configuration is correct
- Most issues are related to domain verification or testing environment

