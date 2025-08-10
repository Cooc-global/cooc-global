-- Fix search path security issues
CREATE OR REPLACE FUNCTION public.get_developer_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT user_id FROM public.profiles WHERE role = 'developer' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.process_transfer_with_fee(
  sender_id UUID,
  recipient_address TEXT,
  amount DECIMAL(20, 2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;