# Stripe Tax Integration Setup Guide

## ✅ Code Integration (COMPLETED)

The code has been updated to integrate Stripe Tax. The payment intent now:
- ✅ Enables `automatic_tax: { enabled: true }`
- ✅ Includes shipping address for tax calculation
- ✅ Calculates tax based on ZIP code (city/county/state)
- ✅ Stores tax amounts in database

## 📋 Required Dashboard Setup

### Step 1: Enable Stripe Tax in Dashboard

1. Go to [Stripe Dashboard → Tax Settings](https://dashboard.stripe.com/settings/tax)
2. Click **"Enable Tax"** or **"Get Started"**
3. Follow the setup wizard

### Step 2: Configure Business Location

1. Enter your **business origin address** (where you ship from)
2. This is used for tax nexus determination

### Step 3: Set Default Product Tax Code

In Stripe Dashboard → Tax Settings:
- **For Physical Books** (hardcover, paperback):
  - Select: `General tangible personal property` (txcd_99999999)
- **For Digital Products** (ebook, audiobook):
  - Select: `Digital products` (txcd_31000000)
  - Or configure digital products as tax-exempt if applicable

### Step 4: Add Tax Registrations (Optional for Testing)

- For **testing**: Stripe Tax will calculate but won't collect until you register
- For **production**: Add your tax registrations in the regions where you have nexus

## 🧪 Testing

1. **Test Mode**: Stripe Tax works in test mode
2. Use test addresses with different ZIP codes
3. Check the payment intent response to see calculated tax amounts

## 💰 Pricing

- **Stripe Tax Fee**: 0.5% per transaction
- **In Addition To**: Standard Stripe processing fees (2.9% + $0.30)
- **Total Fees**: ~3.4% + $0.30 per transaction

## 📊 How It Works

1. Customer enters shipping address (including ZIP code)
2. Payment intent is created with `automatic_tax: { enabled: true }`
3. Stripe calculates tax based on:
   - Shipping ZIP code (determines city/county rates)
   - Product type (physical vs digital)
   - Your tax registrations
4. Tax amount is automatically added to the payment
5. Tax is collected and tracked in Stripe Dashboard

## 🔍 Verification

After setup, check:
- Payment intents show `automatic_tax` in Stripe Dashboard
- Tax amounts appear in payment details
- Tax reports are available in Stripe Dashboard → Tax

## 📝 Notes

- Tax calculation happens automatically - no manual updates needed
- Rates are always up-to-date
- Works for all US states and 60+ countries
- Digital products can be configured as tax-exempt in Dashboard

## 🚨 Important

Make sure to:
1. ✅ Enable Stripe Tax in Dashboard (required)
2. ✅ Set your business address correctly
3. ✅ Configure default product tax codes
4. ✅ Add tax registrations for production use
5. ✅ Test with various ZIP codes before going live

