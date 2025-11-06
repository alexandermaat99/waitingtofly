import Stripe from 'stripe';

// Initialize Stripe client
// Note: The Stripe Node SDK uses the latest API version by default
// This supports automatic tax with Checkout Sessions
// Using preview API version for hooks feature (tax calculation linking)
// The preview version allows linking tax calculations to PaymentIntents via hooks
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30',
  typescript: true,
});

export const formatAmountForStripe = (amount: number): number => {
  return Math.round(amount * 100);
};

export const formatAmountFromStripe = (amount: number): number => {
  return amount / 100;
};

