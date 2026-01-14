-- 1. Update Enums for Status
-- Supabase enums can be tricky to alter directly if they are used by columns.
-- We will add the new values to the existing type if possible.
-- Note: 'open' and 'resolved' likely already exist.
ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'dispatched';
ALTER TYPE report_status ADD VALUE IF NOT EXISTS 'on_scene';

-- 2. Rename the main table
ALTER TABLE reports RENAME TO incidents;

-- 3. Add Severity and Category columns to incidents
-- Using text logic for severity to keep it simple, or we could make ENUMs.
-- User requested: Low, Medium, High, Critical
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- 4. Create Resources Table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- ambulance, personnel, equipment, etc.
  quantity INTEGER DEFAULT 1,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'dispatched', 'depleted', 'maintenance')),
  contact_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on Resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Resources
-- Allow everyone to view resources (for community visibility of safe zones etc)
CREATE POLICY "Public Read Resources" ON resources FOR SELECT USING (true);

-- Allow authenticated users (Agencies/Coordinators) to manage resources
-- Ideally we would have a specific role check, but for now we follow the "authenticated" pattern or specific user check if needed.
-- Assuming "authenticated" users are trusted or we rely on the app's role logic for write access.
CREATE POLICY "Authenticated Manage Resources" ON resources 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 7. Update Realtime Trigger (Optional: if you have specific triggers on 'reports')
-- If you had triggers on 'reports', they usually transfer with the rename, but check their logic.
