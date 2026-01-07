-- =============================================
-- FIX for Customer Signup / Citizen Profile Creation
-- =============================================
-- Issue: New users sign up but no profile is created in 'citizens' table.
-- Cause: The trigger function likely fails silently because of missing search_path
--        in security definer function, or silent exception swallowing.

-- 1. Redefine the function with 'SET search_path = public'
CREATE OR REPLACE FUNCTION create_citizen_profile()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Insert citizen profile
  -- Using explicit public.citizens just to be safe
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
  RAISE WARNING 'Failed to create citizen profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Re-create the trigger to be sure it's linked to the new function version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_citizen_profile();
