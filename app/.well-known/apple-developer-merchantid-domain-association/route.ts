import { NextResponse } from 'next/server';

/**
 * Apple Pay Domain Association File
 * 
 * This file must be accessible at:
 * https://yourdomain.com/.well-known/apple-developer-merchantid-domain-association
 * 
 * To get the actual file content:
 * 1. Go to Stripe Dashboard → Settings → Payment methods → Apple Pay
 * 2. Click "Configure domains"
 * 3. Add your domain
 * 4. Download or copy the domain association file content
 * 5. Replace the placeholder below with the actual content from Stripe
 */
export async function GET() {
  // TODO: Replace this with the actual domain association file content from Stripe
  // You'll get this when you configure your domain in Stripe Dashboard
  const domainAssociationFile = `
# Replace this with the actual file content from Stripe Dashboard
# The file should start with something like:
# -----BEGIN CERTIFICATE-----
# ... certificate content ...
# -----END CERTIFICATE-----
`;

  return new NextResponse(domainAssociationFile.trim(), {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}

