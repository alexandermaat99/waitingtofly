-- Create orders table for storing preorder information
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    book_format VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    book_title VARCHAR(255) DEFAULT 'Waiting to Fly',
    
    -- Shipping information
    shipping_first_name VARCHAR(255) NOT NULL,
    shipping_last_name VARCHAR(255) NOT NULL,
    shipping_address_line1 VARCHAR(255) NOT NULL,
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(100) NOT NULL DEFAULT 'US',
    shipping_phone VARCHAR(20),
    
    -- Shipping tracking
    shipping_status VARCHAR(50) DEFAULT 'not_shipped' CHECK (shipping_status IN ('not_shipped', 'shipped', 'delivered', 'returned')),
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_completed_at TIMESTAMP WITH TIME ZONE,
    payment_failed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id);

-- Create an index on email for customer lookups
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);

-- Create an index on status for filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Create indexes for shipping-related queries
CREATE INDEX IF NOT EXISTS idx_orders_shipping_status ON orders(shipping_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_country ON orders(shipping_country);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_postal_code ON orders(shipping_postal_code);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for completed orders
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

-- Optional: Create a view for orders ready to ship
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

-- Optional: Create a view for order statistics
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

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON orders TO your_app_user;
-- GRANT USAGE ON SEQUENCE orders_id_seq TO your_app_user;

