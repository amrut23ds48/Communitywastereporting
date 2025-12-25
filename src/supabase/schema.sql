-- =============================================
-- Community Waste Reporting Platform
-- Database Schema & Security Policies
-- =============================================

-- Create enum for report status
CREATE TYPE report_status AS ENUM ('open', 'in_progress', 'resolved', 'false_report');

-- =============================================
-- 1. REPORTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  street_name TEXT NOT NULL,
  city TEXT NOT NULL,
  description TEXT,
  status report_status DEFAULT 'open' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_street ON reports(street_name);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_location ON reports(latitude, longitude);

-- =============================================
-- 2. ADMIN ACTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_report ON admin_actions(report_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);

-- =============================================
-- 3. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- *** REPORTS POLICIES ***

-- Allow anyone (including anonymous) to insert reports
CREATE POLICY "Anyone can create reports"
  ON reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to view reports
CREATE POLICY "Anyone can view reports"
  ON reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only authenticated users can update reports (admins)
CREATE POLICY "Authenticated users can update reports"
  ON reports
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete reports (admins)
CREATE POLICY "Authenticated users can delete reports"
  ON reports
  FOR DELETE
  TO authenticated
  USING (true);

-- *** ADMIN ACTIONS POLICIES ***

-- Only authenticated users can insert admin actions
CREATE POLICY "Authenticated users can create admin actions"
  ON admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can view admin actions
CREATE POLICY "Authenticated users can view admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (true);

-- *** NOTIFICATIONS POLICIES ***

-- Only authenticated users can view notifications
CREATE POLICY "Authenticated users can view notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update notifications (mark as read)
CREATE POLICY "Authenticated users can update notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================
-- 5. TRIGGERS & FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reports table
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for setting resolved_at
CREATE TRIGGER set_reports_resolved_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION set_resolved_at();

-- Function to create notifications on status change
CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    INSERT INTO notifications (report_id, message, type)
    VALUES (
      NEW.id,
      'Report #' || substring(NEW.id::text, 1, 8) || ' on ' || NEW.street_name || ' has been resolved',
      'status_resolved'
    );
  END IF;

  -- Create notification when report is marked as false
  IF NEW.status = 'false_report' AND OLD.status != 'false_report' THEN
    INSERT INTO notifications (report_id, message, type)
    VALUES (
      NEW.id,
      'Report #' || substring(NEW.id::text, 1, 8) || ' on ' || NEW.street_name || ' was marked as false report',
      'status_false'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for creating notifications
CREATE TRIGGER create_notification_on_status_change
  AFTER UPDATE ON reports
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION create_status_change_notification();

-- =============================================
-- 6. STORAGE BUCKET SETUP
-- =============================================
-- Note: Run this in Supabase Dashboard SQL Editor or via Supabase CLI
-- This creates the storage bucket and sets up policies

-- Insert storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('waste-reports', 'waste-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for waste-reports bucket
CREATE POLICY "Anyone can upload images"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'waste-reports');

CREATE POLICY "Anyone can view images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'waste-reports');

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'waste-reports');

-- =============================================
-- 7. HELPER VIEWS
-- =============================================

-- View for street-level aggregation
CREATE OR REPLACE VIEW street_statistics AS
SELECT 
  street_name,
  city,
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE status = 'open') as open_reports,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_reports,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_reports,
  COUNT(*) FILTER (WHERE status = 'false_report') as false_reports,
  MAX(created_at) as last_report_date
FROM reports
GROUP BY street_name, city;

-- View for monthly insights
CREATE OR REPLACE VIEW monthly_insights AS
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'open') as open,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
  COUNT(*) FILTER (WHERE status = 'false_report') as false_reports
FROM reports
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Grant access to views
GRANT SELECT ON street_statistics TO anon, authenticated;
GRANT SELECT ON monthly_insights TO anon, authenticated;

-- =============================================
-- 8. DEMO ADMIN USER
-- =============================================
-- Note: For production, create admin users via Supabase Dashboard
-- This is just a reference for the demo credentials

-- Create admin user (run this via Supabase Dashboard or Auth API):
-- Email: admin@waste.com
-- Password: admin123

-- To create via SQL (requires service role):
-- SELECT auth.admin_create_user(
--   email := 'admin@waste.com',
--   password := 'admin123',
--   email_confirm := true
-- );
