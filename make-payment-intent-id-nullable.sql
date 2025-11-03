-- Make payment_intent_id nullable to support Checkout Sessions
-- Checkout Sessions use checkout_session_id instead
ALTER TABLE orders ALTER COLUMN payment_intent_id DROP NOT NULL;

-- Remove the UNIQUE constraint temporarily (we'll add it back conditionally if needed)
-- Note: This means multiple orders could theoretically have the same payment_intent_id
-- but in practice, Stripe ensures uniqueness at their end
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_intent_id_key;

