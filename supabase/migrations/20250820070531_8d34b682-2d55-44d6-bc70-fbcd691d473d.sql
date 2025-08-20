-- Fix process_transfer_with_fee function to record sender's outgoing transaction
CREATE OR REPLACE FUNCTION public.process_transfer_with_fee(sender_id uuid, recipient_address text, amount numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  fee_amount DECIMAL(20, 2);
  referral_bonus DECIMAL(20, 2);
  net_amount DECIMAL(20, 2);
  developer_id UUID;
  referrer_id UUID;
  recipient_id UUID;
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
  
  -- Get recipient user ID by wallet address
  SELECT user_id INTO recipient_id 
  FROM public.profiles 
  WHERE wallet_address = recipient_address;
  
  -- Check if recipient exists
  IF recipient_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Recipient wallet not found');
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
  
  -- Record outgoing transaction for sender
  INSERT INTO public.transactions (
    user_id, 
    transaction_type, 
    amount, 
    description,
    status,
    to_address
  ) VALUES (
    sender_id,
    'transfer_out',
    amount,
    'CLC transfer sent (includes 10% fee)',
    'completed',
    recipient_address
  );
  
  -- Add net amount to recipient wallet
  UPDATE public.wallets 
  SET balance = balance + net_amount 
  WHERE user_id = recipient_id;
  
  -- Record incoming transaction for recipient
  INSERT INTO public.transactions (
    user_id, 
    transaction_type, 
    amount, 
    description,
    status
  ) VALUES (
    recipient_id,
    'transfer_in',
    net_amount,
    'Received CLC transfer (after 10% fee)',
    'completed'
  );
  
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
    'referrer_id', referrer_id,
    'recipient_id', recipient_id
  );
END;
$function$;