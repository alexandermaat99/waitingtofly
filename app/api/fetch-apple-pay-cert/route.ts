import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Helper endpoint to fetch Apple Pay domain association file from Stripe API
// This requires your Stripe secret key and domain ID
//
// Usage: GET /api/fetch-apple-pay-cert?domainId=YOUR_DOMAIN_ID
//
// To find your domain ID:
// 1. Go to Stripe Dashboard → Settings → Payment methods → Apple Pay
// 2. Click "Copy domain ID" next to your domain
// 3. Use that ID in the query parameter above

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get('domainId');

    if (!domainId) {
      return NextResponse.json(
        { 
          error: 'Missing domainId parameter',
          instructions: 'Add ?domainId=YOUR_DOMAIN_ID to the URL. Copy the domain ID from Stripe Dashboard.'
        },
        { status: 400 }
      );
    }

    // Fetch the domain association file from Stripe API
    // Note: This requires the domain to exist in your Stripe account
    const response = await stripe.applePayDomains.retrieve(domainId);
    
    // The association file content might be in the response
    // If not available directly, we'll need to construct it or get it another way
    return NextResponse.json({
      domainId: response.id,
      domain: response.domain,
      created: response.created,
      note: 'The domain association file content is not directly available via API. You may need to download it from the Stripe Dashboard when adding/re-adding the domain.',
      suggestion: 'Try temporarily disabling and re-adding your domain in Stripe Dashboard to get the download option.'
    });

  } catch (error: any) {
    console.error('Error fetching Apple Pay domain:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch domain information',
        hint: 'Make sure your domain ID is correct. Copy it from Stripe Dashboard → Apple Pay settings.'
      },
      { status: 500 }
    );
  }
}

