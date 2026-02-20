-- OneBooking Dashboard Database Schema
-- Version: 1.0.0
-- Date: 2026-02-20

-- ============================================
-- WEBSITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS websites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  webhook_url TEXT,
  webhook_secret TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read websites" ON websites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage websites" ON websites
  FOR ALL TO service_role USING (true);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id TEXT NOT NULL REFERENCES websites(id),
  source_booking_id UUID NOT NULL,
  booking_ref TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_price INTEGER NOT NULL,
  activity_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  guest_count INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'confirmed',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_country_code TEXT,
  special_requests TEXT,
  transport_type TEXT,
  hotel_name TEXT,
  room_number TEXT,
  non_players INTEGER DEFAULT 0,
  private_passengers INTEGER DEFAULT 0,
  transport_cost INTEGER DEFAULT 0,
  addons JSONB DEFAULT '[]',
  stripe_payment_intent_id TEXT,
  admin_notes TEXT,
  source_created_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(website_id, source_booking_id)
);

CREATE INDEX idx_bookings_website_id ON bookings(website_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_activity_date ON bookings(activity_date);
CREATE INDEX idx_bookings_booking_ref ON bookings(booking_ref);
CREATE INDEX idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read bookings" ON bookings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update bookings" ON bookings
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Service role can manage bookings" ON bookings
  FOR ALL TO service_role USING (true);

-- ============================================
-- SYNC_LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  website_id TEXT REFERENCES websites(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  event_type TEXT NOT NULL,
  payload JSONB,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_booking_id ON sync_logs(booking_id);
CREATE INDEX idx_sync_logs_website_id ON sync_logs(website_id);
CREATE INDEX idx_sync_logs_created_at ON sync_logs(created_at DESC);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sync_logs" ON sync_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage sync_logs" ON sync_logs
  FOR ALL TO service_role USING (true);

-- ============================================
-- ADMIN_USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('superadmin', 'admin', 'staff')),
  allowed_websites TEXT[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON admin_users
  FOR SELECT TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Superadmins can read all profiles" ON admin_users
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can manage users" ON admin_users
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

CREATE POLICY "Service role can manage admin_users" ON admin_users
  FOR ALL TO service_role USING (true);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_websites_updated_at
  BEFORE UPDATE ON websites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTH TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SAMPLE DATA
-- ============================================
INSERT INTO websites (id, name, domain, api_key, webhook_url, webhook_secret) VALUES
('hanuman-world', 'Hanuman World Phuket', 'hanumanworld.com', 'hw_sk_live_test123456', 'https://hanumanworld.com/api/webhooks/onebooking', 'whsec_hw_test123'),
('flying-hanuman', 'Flying Hanuman', 'flyinghanuman.com', 'fh_sk_live_test789012', 'https://flyinghanuman.com/api/webhooks/onebooking', 'whsec_fh_test456'),
('hanuman-luge', 'Hanuman Luge', 'hanumanluge.com', 'hl_sk_live_test345678', 'https://hanumanluge.com/api/webhooks/onebooking', 'whsec_hl_test789'),
('test-website', 'Test Website', 'test.onebooking.co', 'test_sk_xxxxx', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
