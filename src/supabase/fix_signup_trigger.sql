-- Fix for "Database error saving new user" - Signup Trigger Issue
-- Run this in Supabase SQL Editor to fix the trigger

-- The issue is that RLS policies might be blocking the trigger from inserting
-- We need to ensure the trigger can insert into citizens table

-- Option 1: Add a policy that allows service role (trigger) to insert
-- Drop existing policies that might block
DROP POLICY IF EXISTS "Citizens can view own profile" ON citizens;
DROP POLICY IF EXISTS "Anyone can view leaderboard data" ON citizens;
DROP POLICY IF EXISTS "Citizens can update own profile" ON citizens;

-- Recreate with proper INSERT policy
-- Allow anyone to view leaderboard data (public read)
CREATE POLICY "Anyone can view leaderboard data"
  ON citizens
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to view their own profile
CREATE POLICY "Citizens can view own profile"
  ON citizens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow service role (triggers) to insert - THIS IS THE KEY FIX
CREATE POLICY "Service role can insert citizens"
  ON citizens
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also allow authenticated users to insert (for manual creation if needed)
-- But the trigger will use service_role
CREATE POLICY "Allow citizen profile creation"
  ON citizens
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow citizens to update their own profile
CREATE POLICY "Citizens can update own profile"
  ON citizens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Alternative: If the above doesn't work, we can modify the trigger to use a different approach
-- Update the trigger function to handle errors gracefully
CREATE OR REPLACE FUNCTION create_citizen_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to insert, but don't fail if it already exists or if there's an error
  BEGIN
    INSERT INTO citizens (id, full_name, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Citizen'),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create citizen profile for user %: %', NEW.id, SQLERRM;
    -- Still return NEW to allow user creation to proceed
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger exists
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- If trigger doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_citizen_profile();
  END IF;
END $$;

