-- Enable the pgcrypto extension for gen_random_bytes function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the handle_new_user function to use a more compatible approach
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
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