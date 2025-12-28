-- ============================================
-- COMPLETE DATABASE SETUP SCRIPT
-- This script creates all tables and RLS policies
-- Safe to run multiple times - won't error if already exists
-- ============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'labour')),
  company_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labour users table
CREATE TABLE IF NOT EXISTS labour_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  shop_name VARCHAR(255),
  area VARCHAR(255),
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sr_no SERIAL,
  product_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  price_piece NUMERIC(10, 2),
  price_carton NUMERIC(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop items table
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sr_no SERIAL,
  product_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  stock_pieces INTEGER DEFAULT 0,
  selling_price NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  order_status VARCHAR(50) DEFAULT 'pending',
  total_amount NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  unit_type VARCHAR(20) CHECK (unit_type IN ('piece', 'carton')),
  price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  bill_number VARCHAR(50) UNIQUE,
  bill_type VARCHAR(20) DEFAULT 'manual',
  bill_date TIMESTAMPTZ DEFAULT NOW(),
  customer_name VARCHAR(255),
  phone VARCHAR(20),
  shop_name VARCHAR(255),
  total_amount NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill items table
CREATE TABLE IF NOT EXISTS bill_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_type VARCHAR(20) CHECK (unit_type IN ('piece', 'carton')),
  price NUMERIC(10, 2) NOT NULL,
  total NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - USERS TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role can insert user profiles" ON users;
CREATE POLICY "Service role can insert user profiles"
ON users FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
USING (auth.uid() = id OR role = 'labour');

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Owners can delete their labour users" ON users;
CREATE POLICY "Owners can delete their labour users"
ON users FOR DELETE
USING (
  role = 'labour' AND
  EXISTS (
    SELECT 1 FROM labour_users
    WHERE labour_users.user_id = users.id
    AND labour_users.owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id AND role = 'owner'
    )
  )
);

DROP POLICY IF EXISTS "Service role can delete users" ON users;
CREATE POLICY "Service role can delete users"
ON users FOR DELETE
USING (true);

-- ============================================
-- RLS POLICIES - LABOUR_USERS TABLE
-- ============================================

DROP POLICY IF EXISTS "Service role can manage labour users" ON labour_users;
CREATE POLICY "Service role can manage labour users"
ON labour_users FOR ALL
USING (true);

DROP POLICY IF EXISTS "Service role can insert labour users" ON labour_users;
CREATE POLICY "Service role can insert labour users"
ON labour_users FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "All authenticated users can view labour users" ON labour_users;
CREATE POLICY "All authenticated users can view labour users"
ON labour_users FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can view their labour users" ON labour_users;
CREATE POLICY "Owners can view their labour users"
ON labour_users FOR SELECT
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "Owners can delete labour users" ON labour_users;
CREATE POLICY "Owners can delete labour users"
ON labour_users FOR DELETE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "Owners can update labour users" ON labour_users;
CREATE POLICY "Owners can update labour users"
ON labour_users FOR UPDATE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "Owners can manage labour users" ON labour_users;
CREATE POLICY "Owners can manage labour users"
ON labour_users FOR INSERT
WITH CHECK (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

-- ============================================
-- RLS POLICIES - CUSTOMERS TABLE
-- ============================================

DROP POLICY IF EXISTS "All authenticated users can view customers" ON customers;
CREATE POLICY "All authenticated users can view customers"
ON customers FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can insert customers" ON customers;
CREATE POLICY "All authenticated users can insert customers"
ON customers FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can update customers" ON customers;
CREATE POLICY "All authenticated users can update customers"
ON customers FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can delete customers" ON customers;
CREATE POLICY "All authenticated users can delete customers"
ON customers FOR DELETE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can view their customers" ON customers;
CREATE POLICY "Owners can view their customers"
ON customers FOR SELECT
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can insert customers" ON customers;
CREATE POLICY "Owners can insert customers"
ON customers FOR INSERT
WITH CHECK (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can update their customers" ON customers;
CREATE POLICY "Owners can update their customers"
ON customers FOR UPDATE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can delete their customers" ON customers;
CREATE POLICY "Owners can delete their customers"
ON customers FOR DELETE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "All owners can view customers" ON customers;
CREATE POLICY "All owners can view customers"
ON customers FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can insert customers" ON customers;
CREATE POLICY "All owners can insert customers"
ON customers FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can update customers" ON customers;
CREATE POLICY "All owners can update customers"
ON customers FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can delete customers" ON customers;
CREATE POLICY "All owners can delete customers"
ON customers FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

-- ============================================
-- RLS POLICIES - PRODUCTS TABLE
-- ============================================

DROP POLICY IF EXISTS "All authenticated users can view products" ON products;
CREATE POLICY "All authenticated users can view products"
ON products FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can insert products" ON products;
CREATE POLICY "All authenticated users can insert products"
ON products FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can update products" ON products;
CREATE POLICY "All authenticated users can update products"
ON products FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can delete products" ON products;
CREATE POLICY "All authenticated users can delete products"
ON products FOR DELETE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can view their products" ON products;
CREATE POLICY "Owners can view their products"
ON products FOR SELECT
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can insert products" ON products;
CREATE POLICY "Owners can insert products"
ON products FOR INSERT
WITH CHECK (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can update their products" ON products;
CREATE POLICY "Owners can update their products"
ON products FOR UPDATE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can delete their products" ON products;
CREATE POLICY "Owners can delete their products"
ON products FOR DELETE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "All owners can view products" ON products;
CREATE POLICY "All owners can view products"
ON products FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can insert products" ON products;
CREATE POLICY "All owners can insert products"
ON products FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can update products" ON products;
CREATE POLICY "All owners can update products"
ON products FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can delete products" ON products;
CREATE POLICY "All owners can delete products"
ON products FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

-- ============================================
-- RLS POLICIES - SHOP_ITEMS TABLE
-- ============================================

DROP POLICY IF EXISTS "All authenticated users can view shop items" ON shop_items;
CREATE POLICY "All authenticated users can view shop items"
ON shop_items FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can insert shop items" ON shop_items;
CREATE POLICY "All authenticated users can insert shop items"
ON shop_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can update shop items" ON shop_items;
CREATE POLICY "All authenticated users can update shop items"
ON shop_items FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can delete shop items" ON shop_items;
CREATE POLICY "All authenticated users can delete shop items"
ON shop_items FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- RLS POLICIES - ORDERS TABLE
-- ============================================

DROP POLICY IF EXISTS "All authenticated users can view orders" ON orders;
CREATE POLICY "All authenticated users can view orders"
ON orders FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can insert orders" ON orders;
CREATE POLICY "All authenticated users can insert orders"
ON orders FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can update orders" ON orders;
CREATE POLICY "All authenticated users can update orders"
ON orders FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can delete orders" ON orders;
CREATE POLICY "All authenticated users can delete orders"
ON orders FOR DELETE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can view their orders" ON orders;
CREATE POLICY "Owners can view their orders"
ON orders FOR SELECT
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Users can insert orders in their workspace" ON orders;
CREATE POLICY "Users can insert orders in their workspace"
ON orders FOR INSERT
WITH CHECK (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can update their orders" ON orders;
CREATE POLICY "Owners can update their orders"
ON orders FOR UPDATE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "All owners can view orders" ON orders;
CREATE POLICY "All owners can view orders"
ON orders FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can insert orders" ON orders;
CREATE POLICY "All owners can insert orders"
ON orders FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can update orders" ON orders;
CREATE POLICY "All owners can update orders"
ON orders FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

-- ============================================
-- RLS POLICIES - ORDER_ITEMS TABLE
-- ============================================

DROP POLICY IF EXISTS "All authenticated users can view order items" ON order_items;
CREATE POLICY "All authenticated users can view order items"
ON order_items FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can insert order items" ON order_items;
CREATE POLICY "All authenticated users can insert order items"
ON order_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can update order items" ON order_items;
CREATE POLICY "All authenticated users can update order items"
ON order_items FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can delete order items" ON order_items;
CREATE POLICY "All authenticated users can delete order items"
ON order_items FOR DELETE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view order items" ON order_items;
CREATE POLICY "Users can view order items"
ON order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id
    )
  )
);

DROP POLICY IF EXISTS "Users can insert order items for their orders" ON order_items;
CREATE POLICY "Users can insert order items for their orders"
ON order_items FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id FROM orders WHERE owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id
    )
  )
);

DROP POLICY IF EXISTS "Users can update their order items" ON order_items;
CREATE POLICY "Users can update their order items"
ON order_items FOR UPDATE
USING (
  order_id IN (
    SELECT id FROM orders WHERE owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their order items" ON order_items;
CREATE POLICY "Users can delete their order items"
ON order_items FOR DELETE
USING (
  order_id IN (
    SELECT id FROM orders WHERE owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id
    )
  )
);

DROP POLICY IF EXISTS "Owners can insert order items" ON order_items;
CREATE POLICY "Owners can insert order items"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "Owners can update order items" ON order_items;
CREATE POLICY "Owners can update order items"
ON order_items FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "Owners can delete order items" ON order_items;
CREATE POLICY "Owners can delete order items"
ON order_items FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

-- ============================================
-- RLS POLICIES - BILLS TABLE
-- ============================================

DROP POLICY IF EXISTS "All authenticated users can view bills" ON bills;
CREATE POLICY "All authenticated users can view bills"
ON bills FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can insert bills" ON bills;
CREATE POLICY "All authenticated users can insert bills"
ON bills FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can update bills" ON bills;
CREATE POLICY "All authenticated users can update bills"
ON bills FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can delete bills" ON bills;
CREATE POLICY "All authenticated users can delete bills"
ON bills FOR DELETE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can view their bills" ON bills;
CREATE POLICY "Owners can view their bills"
ON bills FOR SELECT
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Users can insert bills" ON bills;
CREATE POLICY "Users can insert bills"
ON bills FOR INSERT
WITH CHECK (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can update their bills" ON bills;
CREATE POLICY "Owners can update their bills"
ON bills FOR UPDATE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "Owners can delete their bills" ON bills;
CREATE POLICY "Owners can delete their bills"
ON bills FOR DELETE
USING (
  owner_id IN (SELECT id FROM users WHERE auth.uid() = users.id)
);

DROP POLICY IF EXISTS "All owners can view bills" ON bills;
CREATE POLICY "All owners can view bills"
ON bills FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can insert bills" ON bills;
CREATE POLICY "All owners can insert bills"
ON bills FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can update bills" ON bills;
CREATE POLICY "All owners can update bills"
ON bills FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

DROP POLICY IF EXISTS "All owners can delete bills" ON bills;
CREATE POLICY "All owners can delete bills"
ON bills FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE auth.uid() = users.id AND role = 'owner')
);

-- ============================================
-- RLS POLICIES - BILL_ITEMS TABLE
-- ============================================

DROP POLICY IF EXISTS "All authenticated users can view bill items" ON bill_items;
CREATE POLICY "All authenticated users can view bill items"
ON bill_items FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can insert bill items" ON bill_items;
CREATE POLICY "All authenticated users can insert bill items"
ON bill_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can update bill items" ON bill_items;
CREATE POLICY "All authenticated users can update bill items"
ON bill_items FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All authenticated users can delete bill items" ON bill_items;
CREATE POLICY "All authenticated users can delete bill items"
ON bill_items FOR DELETE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view bill items" ON bill_items;
CREATE POLICY "Users can view bill items"
ON bill_items FOR SELECT
USING (
  bill_id IN (
    SELECT id FROM bills WHERE owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id
    )
  )
);

DROP POLICY IF EXISTS "Users can insert bill items" ON bill_items;
CREATE POLICY "Users can insert bill items"
ON bill_items FOR INSERT
WITH CHECK (
  bill_id IN (
    SELECT id FROM bills WHERE owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id
    )
  )
);

DROP POLICY IF EXISTS "Users can update bill items" ON bill_items;
CREATE POLICY "Users can update bill items"
ON bill_items FOR UPDATE
USING (
  bill_id IN (
    SELECT id FROM bills WHERE owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id
    )
  )
);

DROP POLICY IF EXISTS "Users can delete bill items" ON bill_items;
CREATE POLICY "Users can delete bill items"
ON bill_items FOR DELETE
USING (
  bill_id IN (
    SELECT id FROM bills WHERE owner_id IN (
      SELECT id FROM users WHERE auth.uid() = users.id
    )
  )
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_labour_users_owner_id ON labour_users(owner_id);
CREATE INDEX IF NOT EXISTS idx_labour_users_user_id ON labour_users(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_owner_id ON products(owner_id);
CREATE INDEX IF NOT EXISTS idx_shop_items_owner_id ON shop_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_owner_id ON orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_owner_id ON bills(owner_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer_id ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_created_by ON bills(created_by);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);

-- ============================================
-- COMPLETE! SAFE TO RUN MULTIPLE TIMES
-- ============================================
