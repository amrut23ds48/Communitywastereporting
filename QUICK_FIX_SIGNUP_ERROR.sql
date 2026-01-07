-- QUICK FIX: "Database error saving new user" - Signup Error
-- Run this in Supabase SQL Editor to fix the signup issue immediately

-- The problem: RLS policies on citizens table don't allow INSERT operations
-- This prevents the trigger from creating citizen profiles on signup

-- Step 1: Add INSERT policy for citizens table
CREATE POLICY IF NOT EXISTS "Allow citizen profile creation"
  ON citizens
  FOR INSERT
  TO authenticated, anon, service_role
  WITH CHECK (true);

-- Step 2: Update the trigger function to handle errors gracefully
CREATE OR REPLACE FUNCTION create_citizen_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert citizen profile with error handling
  INSERT INTO citizens (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Citizen'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Failed to create citizen profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Verify trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Step 4: If trigger doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_citizen_profile();
    
    RAISE NOTICE 'Trigger created successfully';
  ELSE
    RAISE NOTICE 'Trigger already exists';
  END IF;
END $$;

-- Step 5: Test by checking if you can see the policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'citizens' AND cmd = 'INSERT';

-- Expected result: You should see "Allow citizen profile creation" policy

