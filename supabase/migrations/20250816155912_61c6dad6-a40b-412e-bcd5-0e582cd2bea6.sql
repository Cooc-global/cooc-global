-- Fix Function Search Path Security Issues

-- Update existing functions to have immutable search_path
CREATE OR REPLACE FUNCTION public.get_developer_user_id()
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT user_id FROM public.profiles WHERE role = 'developer' LIMIT 1;
$function$;

-- Update log_security_event function to have immutable search_path
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_action TEXT,
  event_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.security_logs (user_id, action, details)
  VALUES (auth.uid(), event_action, event_details);
END;
$function$;

-- Update process_transfer_with_fee function to have immutable search_path
CREATE OR REPLACE FUNCTION public.process_transfer_with_fee(sender_id uuid, recipient_address text, amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  fee_amount DECIMAL(20, 2);
  net_amount DECIMAL(20, 2);
  developer_id UUID;
  sender_balance DECIMAL(20, 2);
  result JSON;
BEGIN
  -- Calculate fee (10%) and net amount
  fee_amount := amount * 0.10;
  net_amount := amount - fee_amount;
  
  -- Get developer user ID
  developer_id := public.get_developer_user_id();
  
  -- If no developer exists, skip fee collection
  IF developer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No developer wallet found');
  END IF;
  
  -- Get sender's current balance
  SELECT balance INTO sender_balance FROM public.wallets WHERE user_id = sender_id;
  
  -- Check if sender has sufficient balance
  IF sender_balance < amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Deduct full amount from sender
  UPDATE public.wallets 
  SET balance = balance - amount 
  WHERE user_id = sender_id;
  
  -- Add fee to developer wallet
  UPDATE public.wallets 
  SET balance = balance + fee_amount 
  WHERE user_id = developer_id;
  
  -- Record fee transaction for developer
  INSERT INTO public.transactions (
    user_id, 
    transaction_type, 
    amount, 
    description,
    status
  ) VALUES (
    developer_id,
    'fee_received',
    fee_amount,
    'Transaction fee collected from transfer',
    'completed'
  );
  
  RETURN json_build_object(
    'success', true, 
    'fee_amount', fee_amount, 
    'net_amount', net_amount,
    'developer_id', developer_id
  );
END;
$function$;

-- Update handle_new_user function to have immutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  wallet_addr TEXT;
BEGIN
  -- Generate wallet address using md5 and random for better compatibility
  wallet_addr := '0x' || substring(md5(random()::text || clock_timestamp()::text) from 1 for 40);
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, email, wallet_address)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.email,
    wallet_addr
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00);
  
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function to have immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update calculate_daily_returns function to have immutable search_path
CREATE OR REPLACE FUNCTION public.calculate_daily_returns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  investment_record RECORD;
  return_amount DECIMAL(20, 2);
  return_date DATE := CURRENT_DATE;
BEGIN
  -- Loop through active investments
  FOR investment_record IN 
    SELECT * FROM public.investments 
    WHERE status = 'active' 
    AND end_date >= CURRENT_DATE
    AND start_date < CURRENT_DATE
  LOOP
    -- Check if return already calculated for today
    IF NOT EXISTS (
      SELECT 1 FROM public.daily_returns 
      WHERE investment_id = investment_record.id 
      AND return_date = return_date
    ) THEN
      -- Calculate 5% daily return
      return_amount := investment_record.amount * 0.05;
      
      -- Insert daily return record
      INSERT INTO public.daily_returns (
        investment_id, 
        user_id, 
        amount, 
        return_date
      ) VALUES (
        investment_record.id,
        investment_record.user_id,
        return_amount,
        return_date
      );
    END IF;
  END LOOP;
END;
$function$;