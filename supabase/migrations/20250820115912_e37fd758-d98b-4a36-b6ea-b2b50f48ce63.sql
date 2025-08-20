-- Add delete user functionality and improve user management
-- Create function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION public.delete_user_completely(
  target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_developer BOOLEAN := FALSE;
BEGIN
  -- Check if current user is developer
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'developer'
  ) INTO is_developer;
  
  IF NOT is_developer THEN
    RAISE EXCEPTION 'Access denied: Only developers can delete users';
  END IF;
  
  -- Prevent developers from deleting themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;
  
  -- Delete all user data in correct order to avoid foreign key constraints
  DELETE FROM public.daily_returns WHERE user_id = target_user_id;
  DELETE FROM public.transactions WHERE user_id = target_user_id;
  DELETE FROM public.investments WHERE user_id = target_user_id;
  DELETE FROM public.marketplace WHERE user_id = target_user_id;
  DELETE FROM public.wallets WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Log the action
  PERFORM public.log_security_event(
    'user_deleted',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'deleted_by', auth.uid()
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Create function to add new user (for developer use)
CREATE OR REPLACE FUNCTION public.create_new_user(
  user_email TEXT,
  user_password TEXT,
  full_name TEXT DEFAULT 'New User',
  initial_balance NUMERIC DEFAULT 0.00
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_developer BOOLEAN := FALSE;
  new_user_id UUID;
  wallet_addr TEXT;
BEGIN
  -- Check if current user is developer
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'developer'
  ) INTO is_developer;
  
  IF NOT is_developer THEN
    RAISE EXCEPTION 'Access denied: Only developers can create users';
  END IF;
  
  -- Generate new user ID
  new_user_id := gen_random_uuid();
  
  -- Generate wallet address
  wallet_addr := '0x' || substring(md5(random()::text || clock_timestamp()::text) from 1 for 40);
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, email, wallet_address, status)
  VALUES (new_user_id, full_name, user_email, wallet_addr, 'active');
  
  -- Create wallet with initial balance
  INSERT INTO public.wallets (user_id, balance)
  VALUES (new_user_id, initial_balance);
  
  -- Log the action
  PERFORM public.log_security_event(
    'user_created_by_developer',
    jsonb_build_object(
      'new_user_id', new_user_id,
      'created_by', auth.uid(),
      'initial_balance', initial_balance
    )
  );
  
  RETURN new_user_id;
END;
$$;