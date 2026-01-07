-- =============================================
-- Citizen Dashboard Integration
-- Database Schema Migration
-- =============================================
-- This file extends the existing schema.sql with citizen-specific tables,
-- functions, and triggers for the gamification system.

-- =============================================
-- 1. CITIZENS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS citizens (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0 NOT NULL,
  current_level INTEGER DEFAULT 1 NOT NULL,
  rank_title TEXT DEFAULT 'Eco Starter' NOT NULL,
  total_reports INTEGER DEFAULT 0 NOT NULL,
  resolved_reports INTEGER DEFAULT 0 NOT NULL,
  neighborhood TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_citizens_points ON citizens(total_points DESC);
CREATE INDEX idx_citizens_city ON citizens(city);
CREATE INDEX idx_citizens_neighborhood ON citizens(neighborhood);
CREATE INDEX idx_citizens_level ON citizens(current_level DESC);

-- =============================================
-- 2. UPDATE REPORTS TABLE
-- =============================================
-- Add citizen_id foreign key to link reports to citizens
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS citizen_id UUID REFERENCES citizens(id) ON DELETE SET NULL;

-- Create index for citizen reports queries
CREATE INDEX IF NOT EXISTS idx_reports_citizen ON reports(citizen_id);

-- =============================================
-- 3. CITIZEN ACTIVITY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS citizen_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  points_awarded INTEGER DEFAULT 0 NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_citizen_activity_citizen ON citizen_activity(citizen_id, created_at DESC);
CREATE INDEX idx_citizen_activity_report ON citizen_activity(report_id);

-- =============================================
-- 4. UPDATE NOTIFICATIONS TABLE
-- =============================================
-- Add citizen_id to link notifications to citizens
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS citizen_id UUID REFERENCES citizens(id) ON DELETE CASCADE;

-- Create index for citizen notifications
CREATE INDEX IF NOT EXISTS idx_notifications_citizen ON notifications(citizen_id, is_read);

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Function to calculate level from points
-- Accepts BIGINT to match PostgreSQL's COUNT() return type
CREATE OR REPLACE FUNCTION calculate_level(points BIGINT)
RETURNS INTEGER AS $$
BEGIN
  IF points >= 8000 THEN RETURN 8;
  ELSIF points >= 4000 THEN RETURN 7;
  ELSIF points >= 2000 THEN RETURN 6;
  ELSIF points >= 1000 THEN RETURN 5;
  ELSIF points >= 500 THEN RETURN 4;
  ELSIF points >= 250 THEN RETURN 3;
  ELSIF points >= 100 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get rank title from level
CREATE OR REPLACE FUNCTION get_rank_title(level INTEGER)
RETURNS TEXT AS $$
BEGIN
  CASE level
    WHEN 1 THEN RETURN 'Eco Starter';
    WHEN 2 THEN RETURN 'Eco Helper';
    WHEN 3 THEN RETURN 'Eco Contributor';
    WHEN 4 THEN RETURN 'Eco Advocate';
    WHEN 5 THEN RETURN 'Eco Warrior';
    WHEN 6 THEN RETURN 'Eco Champion';
    WHEN 7 THEN RETURN 'Eco Hero';
    ELSE RETURN 'Eco Legend';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to award points to citizen
CREATE OR REPLACE FUNCTION award_points_to_citizen(
  p_citizen_id UUID,
  p_points INTEGER,
  p_activity_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_report_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  new_total_points INTEGER;
  new_level INTEGER;
  new_rank_title TEXT;
BEGIN
  -- Update citizen's points
  UPDATE citizens
  SET 
    total_points = total_points + p_points,
    updated_at = NOW()
  WHERE id = p_citizen_id
  RETURNING total_points INTO new_total_points;

  -- Calculate new level and rank
  new_level := calculate_level(new_total_points);
  new_rank_title := get_rank_title(new_level);

  -- Update level and rank if changed
  UPDATE citizens
  SET 
    current_level = new_level,
    rank_title = new_rank_title,
    updated_at = NOW()
  WHERE id = p_citizen_id AND (current_level != new_level OR rank_title != new_rank_title);

  -- Record activity
  INSERT INTO citizen_activity (citizen_id, report_id, activity_type, points_awarded, description)
  VALUES (p_citizen_id, p_report_id, p_activity_type, p_points, p_description);

  RETURN new_total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. TRIGGERS
-- =============================================

-- Trigger to update updated_at timestamp on citizens
CREATE TRIGGER update_citizens_updated_at
  BEFORE UPDATE ON citizens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create citizen profile on user signup
CREATE OR REPLACE FUNCTION create_citizen_profile()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert citizen profile with error handling
  -- The function runs with SECURITY DEFINER, so it has elevated privileges
  INSERT INTO public.citizens (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Citizen'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  -- This ensures signup can still succeed even if profile creation fails
  RAISE WARNING 'Failed to create citizen profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_citizen_profile();

-- Trigger to award points when report is created
CREATE OR REPLACE FUNCTION on_report_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if citizen_id is set
  IF NEW.citizen_id IS NOT NULL THEN
    -- Award 10 points for submitting report
    PERFORM award_points_to_citizen(
      NEW.citizen_id,
      10,
      'report_submitted',
      'Report submitted: ' || NEW.street_name,
      NEW.id
    );

    -- Increment total_reports counter
    UPDATE citizens
    SET total_reports = total_reports + 1
    WHERE id = NEW.citizen_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for report creation
DROP TRIGGER IF EXISTS trigger_on_report_created ON reports;
CREATE TRIGGER trigger_on_report_created
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION on_report_created();

-- Trigger to award points and create notifications on status change
CREATE OR REPLACE FUNCTION on_report_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if citizen_id is set and status changed
  IF NEW.citizen_id IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Award points based on status change
    IF NEW.status = 'in_progress' AND OLD.status = 'open' THEN
      -- Report verified: +20 points
      PERFORM award_points_to_citizen(
        NEW.citizen_id,
        20,
        'report_verified',
        'Report verified: ' || NEW.street_name,
        NEW.id
      );

      -- Create notification
      INSERT INTO notifications (report_id, citizen_id, message, type)
      VALUES (
        NEW.id,
        NEW.citizen_id,
        'Your report on ' || NEW.street_name || ' is being reviewed',
        'status_in_progress'
      );

    ELSIF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
      -- Report resolved: +50 points
      PERFORM award_points_to_citizen(
        NEW.citizen_id,
        50,
        'report_resolved',
        'Report resolved: ' || NEW.street_name,
        NEW.id
      );

      -- Increment resolved_reports counter
      UPDATE citizens
      SET resolved_reports = resolved_reports + 1
      WHERE id = NEW.citizen_id;

      -- Create notification
      INSERT INTO notifications (report_id, citizen_id, message, type)
      VALUES (
        NEW.id,
        NEW.citizen_id,
        'Your report on ' || NEW.street_name || ' has been resolved! +50 points',
        'status_resolved'
      );

    ELSIF NEW.status = 'false_report' AND OLD.status != 'false_report' THEN
      -- False report: -10 points penalty
      PERFORM award_points_to_citizen(
        NEW.citizen_id,
        -10,
        'report_false',
        'Report marked as false: ' || NEW.street_name,
        NEW.id
      );

      -- Create notification
      INSERT INTO notifications (report_id, citizen_id, message, type)
      VALUES (
        NEW.id,
        NEW.citizen_id,
        'Your report on ' || NEW.street_name || ' was marked as false report',
        'status_false'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing trigger or create new one
DROP TRIGGER IF EXISTS trigger_on_report_status_changed ON reports;
CREATE TRIGGER trigger_on_report_status_changed
  AFTER UPDATE ON reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION on_report_status_changed();

-- =============================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE citizens ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_activity ENABLE ROW LEVEL SECURITY;

-- Citizens table policies
-- IMPORTANT: Allow INSERT for triggers (service_role) and authenticated users
-- This is needed for the signup trigger to work
CREATE POLICY "Allow citizen profile creation"
  ON citizens
  FOR INSERT
  TO authenticated, anon, service_role
  WITH CHECK (true);

-- Citizens can view their own profile
CREATE POLICY "Citizens can view own profile"
  ON citizens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Citizens can view public leaderboard data (points, rank, name, avatar)
CREATE POLICY "Anyone can view leaderboard data"
  ON citizens
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Citizens can update their own profile (name, avatar, neighborhood)
CREATE POLICY "Citizens can update own profile"
  ON citizens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Citizen activity policies
-- Citizens can only view their own activity
CREATE POLICY "Citizens can view own activity"
  ON citizen_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = citizen_id);

-- Only system can insert activity (via triggers/functions)
CREATE POLICY "System can insert activity"
  ON citizen_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Will be restricted by SECURITY DEFINER functions

-- Update reports policies to allow citizens to link their reports
-- (Keep existing policies, but ensure citizens can set citizen_id on insert)
DROP POLICY IF EXISTS "Anyone can create reports" ON reports;
CREATE POLICY "Anyone can create reports"
  ON reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Citizens can set their own citizen_id
    (citizen_id IS NULL OR citizen_id = auth.uid())
  );

-- Update notifications policies
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON notifications;
CREATE POLICY "Citizens can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    citizen_id IS NULL OR citizen_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authenticated users can update notifications" ON notifications;
CREATE POLICY "Citizens can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (citizen_id = auth.uid())
  WITH CHECK (citizen_id = auth.uid());

-- =============================================
-- 8. HELPER VIEWS
-- =============================================

-- Leaderboard view with rankings
CREATE OR REPLACE VIEW citizen_leaderboard AS
SELECT 
  c.id,
  c.full_name,
  c.avatar_url,
  c.total_points,
  c.current_level,
  c.rank_title,
  c.total_reports,
  c.resolved_reports,
  c.city,
  c.neighborhood,
  ROW_NUMBER() OVER (ORDER BY c.total_points DESC, c.created_at ASC) as global_rank,
  CASE 
    WHEN c.city IS NOT NULL THEN 
      ROW_NUMBER() OVER (PARTITION BY c.city ORDER BY c.total_points DESC, c.created_at ASC)
    ELSE NULL
  END as city_rank,
  CASE 
    WHEN c.neighborhood IS NOT NULL THEN 
      ROW_NUMBER() OVER (PARTITION BY c.neighborhood ORDER BY c.total_points DESC, c.created_at ASC)
    ELSE NULL
  END as neighborhood_rank
FROM citizens c
WHERE c.total_points >= 0
ORDER BY c.total_points DESC, c.created_at ASC;

-- Grant access to views
GRANT SELECT ON citizen_leaderboard TO anon, authenticated;

-- Citizen stats view (for dashboard)
CREATE OR REPLACE VIEW citizen_stats AS
SELECT 
  c.id,
  c.full_name,
  c.avatar_url,
  c.total_points,
  c.current_level,
  c.rank_title,
  c.total_reports,
  c.resolved_reports,
  c.neighborhood,
  c.city,
  -- Calculate points needed for next level
  CASE 
    WHEN c.current_level = 1 THEN 100 - c.total_points
    WHEN c.current_level = 2 THEN 250 - c.total_points
    WHEN c.current_level = 3 THEN 500 - c.total_points
    WHEN c.current_level = 4 THEN 1000 - c.total_points
    WHEN c.current_level = 5 THEN 2000 - c.total_points
    WHEN c.current_level = 6 THEN 4000 - c.total_points
    WHEN c.current_level = 7 THEN 8000 - c.total_points
    ELSE NULL
  END as points_to_next_level,
  -- Calculate points for current level
  CASE 
    WHEN c.current_level = 1 THEN 0
    WHEN c.current_level = 2 THEN 100
    WHEN c.current_level = 3 THEN 250
    WHEN c.current_level = 4 THEN 500
    WHEN c.current_level = 5 THEN 1000
    WHEN c.current_level = 6 THEN 2000
    WHEN c.current_level = 7 THEN 4000
    ELSE 8000
  END as current_level_points,
  -- Get global rank
  (SELECT COUNT(*) + 1 FROM citizens WHERE total_points > c.total_points) as global_rank,
  -- Get city rank
  CASE 
    WHEN c.city IS NOT NULL THEN
      (SELECT COUNT(*) + 1 FROM citizens WHERE city = c.city AND total_points > c.total_points)
    ELSE NULL
  END as city_rank,
  -- Get neighborhood rank
  CASE 
    WHEN c.neighborhood IS NOT NULL THEN
      (SELECT COUNT(*) + 1 FROM citizens WHERE neighborhood = c.neighborhood AND total_points > c.total_points)
    ELSE NULL
  END as neighborhood_rank
FROM citizens c;

GRANT SELECT ON citizen_stats TO authenticated;

-- =============================================
-- 9. MIGRATION FOR EXISTING DATA
-- =============================================

-- Create citizen profiles for existing auth users (if any)
INSERT INTO citizens (id, full_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email, 'Citizen')
FROM auth.users
WHERE id NOT IN (SELECT id FROM citizens)
ON CONFLICT (id) DO NOTHING;

-- Calculate initial points for existing citizens based on their reports
-- (This assumes reports table already has citizen_id populated, or you'll need to manually assign)
UPDATE citizens c
SET 
  total_reports = (
    SELECT COUNT(*) 
    FROM reports r 
    WHERE r.citizen_id = c.id
  ),
  resolved_reports = (
    SELECT COUNT(*) 
    FROM reports r 
    WHERE r.citizen_id = c.id AND r.status = 'resolved'
  ),
  total_points = (
    -- Base points: 10 per report + 20 per in_progress + 50 per resolved
    SELECT 
      (COUNT(*) * 10 + 
       COUNT(*) FILTER (WHERE status = 'in_progress') * 20 +
       COUNT(*) FILTER (WHERE status = 'resolved') * 50)::INTEGER
    FROM reports r
    WHERE r.citizen_id = c.id
  ),
  current_level = calculate_level((
    SELECT 
      COUNT(*) * 10 + 
      COUNT(*) FILTER (WHERE status = 'in_progress') * 20 +
      COUNT(*) FILTER (WHERE status = 'resolved') * 50
    FROM reports r
    WHERE r.citizen_id = c.id
  )),
  rank_title = get_rank_title(calculate_level((
    SELECT 
      COUNT(*) * 10 + 
      COUNT(*) FILTER (WHERE status = 'in_progress') * 20 +
      COUNT(*) FILTER (WHERE status = 'resolved') * 50
    FROM reports r
    WHERE r.citizen_id = c.id
  )))
WHERE EXISTS (SELECT 1 FROM reports r WHERE r.citizen_id = c.id);

-- =============================================
-- 10. COMMENTS
-- =============================================

COMMENT ON TABLE citizens IS 'Citizen profiles with gamification data (points, levels, ranks)';
COMMENT ON TABLE citizen_activity IS 'Detailed activity log for each citizen';
COMMENT ON FUNCTION calculate_level IS 'Calculates citizen level based on total points';
COMMENT ON FUNCTION get_rank_title IS 'Returns rank title based on level';
COMMENT ON FUNCTION award_points_to_citizen IS 'Awards points to citizen and records activity';
COMMENT ON VIEW citizen_leaderboard IS 'Leaderboard view with global, city, and neighborhood rankings';
COMMENT ON VIEW citizen_stats IS 'Aggregated stats view for citizen dashboard';

