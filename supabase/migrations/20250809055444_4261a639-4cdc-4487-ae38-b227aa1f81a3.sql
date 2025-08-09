-- Fix security linter warnings by setting search_path for functions

-- Update handle_new_user function with proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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

-- Update update_updated_at_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update calculate_daily_returns function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_daily_returns()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
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