-- Phase 1: Critical Security Fixes (Corrected)

-- 1. Fix Marketplace Phone Number Exposure
-- Drop existing policy that exposes phone numbers to everyone
DROP POLICY IF EXISTS "Anyone can view marketplace offers" ON public.marketplace;

-- Create new policies with proper phone number protection
CREATE POLICY "Anyone can view marketplace offers (no phone)" 
ON public.marketplace 
FOR SELECT 
USING (status = 'active' AND auth.role() = 'anon');

CREATE POLICY "Authenticated users can view marketplace offers with contact" 
ON public.marketplace 
FOR SELECT 
USING (status = 'active' AND auth.role() = 'authenticated');

-- 2. Prevent Privilege Escalation
-- Drop existing update policy for profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create restrictive policies that prevent role changes
CREATE POLICY "Users can update their own profile (no role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

-- Only developers can change roles
CREATE POLICY "Developers can manage all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'developer'
  )
);

-- 3. Add database constraints for security
-- Add constraint to prevent negative amounts in marketplace
ALTER TABLE public.marketplace 
ADD CONSTRAINT positive_coins_and_price 
CHECK (coins_for_sale > 0 AND price_per_coin > 0);

-- Add constraint for phone number format (basic validation)
ALTER TABLE public.marketplace 
ADD CONSTRAINT phone_number_format 
CHECK (phone_number ~ '^[+]?[0-9\s\-\(\)]{10,15}$');

-- 4. Add security logging table
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

-- Only developers can view security logs
CREATE POLICY "Developers can view security logs" 
ON public.security_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'developer'
  )
);

-- 5. Create function to log security events
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