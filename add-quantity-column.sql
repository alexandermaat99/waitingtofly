-- Add quantity column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL;

-- Update existing orders to have quantity of 1 if they don't have one
UPDATE orders SET quantity = 1 WHERE quantity IS NULL;

-- Add index for quantity if needed
CREATE INDEX IF NOT EXISTS idx_orders_quantity ON orders(quantity);

