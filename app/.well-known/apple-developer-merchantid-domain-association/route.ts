import { NextResponse } from 'next/server';

// Apple Pay Domain Association File
// 
// The domain association file content is provided by Stripe when you add a domain.
// 
// To get the file content from Stripe Dashboard:
// 
// Option 1: Re-add domain to trigger download
// 1. Go to Stripe Dashboard → Settings → Payment methods → Apple Pay
// 2. Click "Disable" on your current domain
// 3. Click "Add domain" again
// 4. When prompted, click "Download Verification File"
// 5. Copy the entire content (including BEGIN/END lines)
//
// Option 2: Use Stripe API
// The file is accessible via: https://api.stripe.com/v1/apple_pay/domains/{domain_id}/association
// But you need to be authenticated with your secret key
//
// Option 3: Contact Stripe Support
// They can provide the file content for your domain

// TEMPORARY: Placeholder - replace with actual certificate content from Stripe
// The certificate typically starts with: -----BEGIN CERTIFICATE-----
// and ends with: -----END CERTIFICATE-----

export async function GET() {
  // Apple Pay Domain Association File Content
  // This is the merchant identifier from Stripe Dashboard
  const DOMAIN_ASSOCIATION_FILE = `merchant.com.waitingtoflymemoir`;

  // Return the file with correct headers
  return new NextResponse(DOMAIN_ASSOCIATION_FILE, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
