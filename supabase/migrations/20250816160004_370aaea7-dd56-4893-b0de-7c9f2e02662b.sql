-- Critical Security Fixes - Clean Implementation

-- 1. First handle privilege escalation by dropping and recreating profile policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (no role)" ON public.profiles;
DROP POLICY IF EXISTS "Developers can manage all profiles" ON public.profiles;

-- Create secure profile policies that prevent role self-assignment
CREATE POLICY "Users can update own profile (no role changes)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- Only developers can change any profile roles
CREATE POLICY "Only developers can manage profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'developer'
  )
);

-- 2. Add database constraints for input validation
DO $$ 
BEGIN
  -- Add marketplace constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'positive_coins_and_price'
  ) THEN
    ALTER TABLE public.marketplace 
    ADD CONSTRAINT positive_coins_and_price 
    CHECK (coins_for_sale > 0 AND price_per_coin > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'phone_number_format'
  ) THEN
    ALTER TABLE public.marketplace 
    ADD CONSTRAINT phone_number_format 
    CHECK (phone_number ~ '^[+]?[0-9\s\-\(\)]{10,15}$');
  END IF;
END $$;

-- 3. Create security logging table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing security log policies and recreate
DROP POLICY IF EXISTS "Developers can view security logs" ON public.security_logs;

CREATE POLICY "Only developers can view security logs" 
ON public.security_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'developer'
  )
);

-- 4. Create/update security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_action TEXT,
  event_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_logs (user_id, action, details)
  VALUES (auth.uid(), event_action, event_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for role change logging
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS log_profile_role_changes ON public.profiles;

CREATE TRIGGER log_profile_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_changes();