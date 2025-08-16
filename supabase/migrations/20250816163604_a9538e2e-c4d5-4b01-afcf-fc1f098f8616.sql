-- Add referral system to profiles table
ALTER TABLE public.profiles 
ADD COLUMN referral_code TEXT UNIQUE,
ADD COLUMN referred_by TEXT;

-- Generate referral codes for existing users
UPDATE public.profiles 
SET referral_code = UPPER(LEFT(MD5(user_id::TEXT), 8))
WHERE referral_code IS NULL;

-- Create function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate a unique 8-character referral code
  NEW.referral_code := UPPER(LEFT(MD5(NEW.user_id::TEXT), 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to generate referral codes for new users
CREATE OR REPLACE TRIGGER generate_referral_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Update the transfer function to include 5% referral bonus
CREATE OR REPLACE FUNCTION public.process_transfer_with_fee(sender_id uuid, recipient_address text, amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fee_amount DECIMAL(20, 2);
  referral_bonus DECIMAL(20, 2);
  net_amount DECIMAL(20, 2);
  developer_id UUID;
  referrer_id UUID;
  sender_balance DECIMAL(20, 2);
  result JSON;
BEGIN
  -- Calculate fee (10%) and referral bonus (5% of transfer amount)
  fee_amount := amount * 0.10;
  referral_bonus := amount * 0.05;
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
  
  -- Get referrer ID from sender's profile
  SELECT p2.user_id INTO referrer_id 
  FROM public.profiles p1
  JOIN public.profiles p2 ON p1.referred_by = p2.referral_code
  WHERE p1.user_id = sender_id;
  
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
  
  -- If referrer exists, give them 5% bonus
  IF referrer_id IS NOT NULL THEN
    -- Add referral bonus to referrer wallet
    UPDATE public.wallets 
    SET balance = balance + referral_bonus 
    WHERE user_id = referrer_id;
    
    -- Record referral bonus transaction
    INSERT INTO public.transactions (
      user_id, 
      transaction_type, 
      amount, 
      description,
      status
    ) VALUES (
      referrer_id,
      'referral_bonus',
      referral_bonus,
      'Referral bonus from user transfer',
      'completed'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'fee_amount', fee_amount, 
    'net_amount', net_amount,
    'referral_bonus', COALESCE(referral_bonus, 0),
    'developer_id', developer_id,
    'referrer_id', referrer_id
  );
END;
$$;