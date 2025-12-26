-- Fix for RLS policy violation when creating notifications
-- This updates the trigger function to run with SECURITY DEFINER,
-- effectively bypassing RLS for the system-generated insert.

CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS TRIGGER
SECURITY DEFINER -- This line is the fix
AS $$
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
