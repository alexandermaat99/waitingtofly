# Resend Email Setup

This project uses [Resend](https://resend.com) to send custom order confirmation emails.

## Setup Instructions

### 1. Create a Resend Account

1. Go to https://resend.com
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

### 2. Get Your API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Production" or "Development")
4. Copy the API key (starts with `re_`)

### 3. Set Up Your Domain (Required for Production)

For production, you'll need to verify a domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain provider
5. Wait for verification (usually takes a few minutes)

### 4. Configure Environment Variables

Add these to your `.env.local` file (for local development) and your Vercel environment variables (for production):

```env
# Resend API Key (required)
RESEND_API_KEY=re_your_api_key_here

# Email "From" address (optional - defaults to noreply@yourdomain.com)
# Must use a verified domain from Resend
RESEND_FROM_EMAIL=orders@yourdomain.com

# Email "From" name (optional - defaults to "Waiting to Fly")
RESEND_FROM_NAME=Waiting to Fly

# Admin email for order notifications (optional)
# When an order is placed, an admin notification email will be sent to this address
ADMIN_EMAIL=admin@yourdomain.com
```

### 5. Deploy to Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the four variables above:
   - `RESEND_API_KEY` (required)
   - `RESEND_FROM_EMAIL` (optional)
   - `RESEND_FROM_NAME` (optional)
   - `ADMIN_EMAIL` (optional - for order notifications)
4. Redeploy your application

## Testing

1. Make a test order in **live mode** (not test mode)
2. Complete the checkout process
3. Check the customer's email inbox for the confirmation email
4. Check the admin email inbox (if `ADMIN_EMAIL` is set) for the order notification
5. Check Vercel logs for email sending status

## Email Templates

### Customer Order Confirmation Email

The order confirmation email sent to customers includes:
- Order details (ID, book, format, quantity)
- Shipping address
- Order summary (subtotal, tax, shipping, total)
- Next steps information
- Branded design matching your website

### Admin Order Notification Email

When an order is placed, an admin notification email is automatically sent to the `ADMIN_EMAIL` address (if configured). This email includes:
- Customer information (name, email)
- Order ID and checkout session ID
- Order details (book, format, quantity)
- Shipping address
- Order summary (subtotal, tax, shipping, total)
- Formatted for easy review and action

**Note:** If `ADMIN_EMAIL` is not set, admin notifications will be skipped (this won't affect customer emails).

## Troubleshooting

### Emails not sending?

1. **Check environment variables** - Make sure `RESEND_API_KEY` is set
2. **Verify domain** - For production, your domain must be verified in Resend
3. **Check logs** - Look in Vercel function logs for email errors
4. **Test API key** - Try sending a test email in Resend dashboard

### Email goes to spam?

1. **Verify domain** - Proper domain verification improves deliverability
2. **SPF/DKIM records** - Resend automatically sets these up when you verify your domain
3. **From address** - Use a verified domain email address

## Customization

To customize the email templates, edit:
- `lib/email.ts` - Email HTML/text templates
- Email includes your brand colors and styling
- Modify the `sendOrderConfirmationEmail` function to customize customer emails
- Modify the `sendAdminOrderNotificationEmail` function to customize admin notifications


