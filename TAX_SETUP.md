# Tax Configuration Guide

## 🧾 Tax Implementation Overview

Your checkout now includes automatic tax calculation based on the customer's shipping location and product type.

## ⚙️ Configuration

### 1. **Update Tax Rates** (`/lib/tax-config.ts`)
Edit the `TAX_CONFIG.taxRates` object to match your tax obligations:

```typescript
taxRates: {
  'US-CA': 0.0875, // California 8.75%
  'US-NY': 0.08,   // New York 8%
  // Add more states/countries as needed
}
```

### 2. **Set Business Location** (`/lib/tax-config.ts`)
Update your business location for tax nexus determination:

```typescript
businessLocation: {
  country: 'US',
  state: 'CA', // Your business state
}
```

### 3. **Digital Products Tax Exemption** (`/lib/tax-config.ts`)
Configure whether digital products are tax-exempt:

```typescript
digitalProductsExempt: true, // Set to false if you need to charge tax on digital products
```

## 🏛️ Tax Compliance Options

### **Option 1: Manual Tax Calculation (Current Implementation)**
- ✅ **Free** - No additional Stripe fees
- ✅ **Full control** - You manage tax rates and rules
- ⚠️ **Your responsibility** - You must ensure compliance and file taxes

### **Option 2: Stripe Tax (Recommended for Production)**
- ✅ **Automatic compliance** - Stripe handles tax calculation and filing
- ✅ **Always up-to-date** - Tax rates updated automatically
- ✅ **Simplified reporting** - Stripe provides tax reports
- 💰 **Additional cost** - ~0.5% fee on transactions
- 🔗 **Setup**: Enable in Stripe Dashboard → Tax settings

## 📊 Current Tax Logic

### **Physical Products** (Hardcover, Paperback)
- Tax calculated based on shipping address
- Rates vary by state/country

### **Digital Products** (E-book, Audiobook)
- Currently set to **tax-exempt** (configurable)
- May be subject to tax in some jurisdictions

## 🗄️ Database Storage

Tax information is stored in the `orders` table:
- `subtotal` - Product price before tax
- `tax_amount` - Tax amount charged
- `tax_rate` - Tax rate used (decimal format)

## 🔧 Migration Required

Run the updated migration script to add tax columns:

```sql
-- Run: add-shipping-columns.sql
```

## ⚖️ Legal Considerations

**Important**: Tax laws vary by jurisdiction and business type. Consult with a tax professional to ensure compliance with:

- Sales tax nexus requirements
- Digital product tax obligations
- International VAT/GST requirements
- Tax registration requirements

## 🚀 Next Steps

1. **Update tax rates** in `/lib/tax-config.ts` for your business
2. **Run database migration** to add tax columns
3. **Test checkout flow** with different addresses
4. **Consider Stripe Tax** for production use
5. **Consult tax professional** for compliance requirements

## 📞 Support

- **Stripe Tax Documentation**: https://stripe.com/docs/tax
- **Sales Tax Calculator**: https://www.avalara.com/taxrates/
- **Tax Professional**: Recommended for business compliance
