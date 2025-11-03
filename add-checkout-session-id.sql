-- Add checkout_session_id column to orders table for Stripe Checkout Sessions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS checkout_session_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session_id ON orders(checkout_session_id);

-- Make payment_intent_id nullable (since Checkout Sessions use checkout_session_id instead)
-- This allows both Payment Intents and Checkout Sessions to work
ALTER TABLE orders ALTER COLUMN payment_intent_id DROP NOT NULL;

-- Note: We're removing the UNIQUE constraint on payment_intent_id because:
-- 1. Checkout Sessions might not have payment_intent_id initially
-- 2. Multiple checkout sessions could theoretically share the same payment_intent
-- If you need strict uniqueness, you can add a partial unique index:
-- CREATE UNIQUE INDEX idx_orders_payment_intent_id_unique ON orders(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_intent_id_key;

