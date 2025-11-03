import Stripe from 'stripe';

// Initialize Stripe client with API version that supports Stripe Tax with Payment Intents
// Note: For Stripe Tax calculations with Payment Intents, we need the preview API version
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.preview', // Preview API version that supports tax calculations with Payment Intents
});

export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};

