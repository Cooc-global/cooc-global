-- Fix remaining security linter warnings

-- 1. Fix function search path issues for security functions
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_action TEXT,
  event_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_logs (user_id, action, details)
  VALUES (auth.uid(), event_action, event_details);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_security_event(
      'role_changed',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'target_user_id', NEW.user_id,
        'changed_by', auth.uid()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;