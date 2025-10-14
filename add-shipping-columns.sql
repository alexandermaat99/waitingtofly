-- Add shipping columns to existing orders table
-- Run this script to update your existing database

-- Add shipping information columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_first_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_last_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line1 VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line2 VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100) DEFAULT 'US';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(20);

-- Add shipping tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status VARCHAR(50) DEFAULT 'not_shipped' CHECK (shipping_status IN ('not_shipped', 'shipped', 'delivered', 'returned'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Add tax calculation columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0;

-- Add indexes for shipping-related queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_country ON orders(shipping_country);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_postal_code ON orders(shipping_postal_code);

-- Update the completed_orders view to include shipping information
CREATE OR REPLACE VIEW completed_orders AS
SELECT 
    id,
    email,
    name,
    book_format,
    amount,
    book_title,
    shipping_first_name,
    shipping_last_name,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
    shipping_phone,
    shipping_status,
    tracking_number,
    shipped_at,
    delivered_at,
    created_at,
    payment_completed_at
FROM orders 
WHERE status = 'completed'
ORDER BY payment_completed_at DESC;

-- Create a view for orders ready to ship
CREATE OR REPLACE VIEW orders_to_ship AS
SELECT 
    id,
    email,
    name,
    book_format,
    book_title,
    shipping_first_name,
    shipping_last_name,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
    shipping_phone,
    payment_completed_at
FROM orders 
WHERE status = 'completed' 
  AND shipping_status = 'not_shipped'
ORDER BY payment_completed_at ASC;

-- Update the order statistics view
CREATE OR REPLACE VIEW order_stats AS
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_orders,
    COUNT(CASE WHEN shipping_status = 'not_shipped' AND status = 'completed' THEN 1 END) as orders_to_ship,
    COUNT(CASE WHEN shipping_status = 'shipped' THEN 1 END) as orders_shipped,
    COUNT(CASE WHEN shipping_status = 'delivered' THEN 1 END) as orders_delivered,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
    AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as average_order_value
FROM orders;
