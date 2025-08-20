-- Ensure all transaction fees are automatically deposited to developer wallet
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
  
  -- Get developer user ID - CRITICAL: This must succeed for fee collection
  developer_id := public.get_developer_user_id();
  
  -- ENSURE developer wallet exists for automatic fee deposit
  IF developer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No developer wallet found - fee collection failed');
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
  
  -- STEP 1: Deduct full amount from sender (includes fee)
  UPDATE public.wallets 
  SET balance = balance - amount 
  WHERE user_id = sender_id;
  
  -- STEP 2: AUTOMATICALLY deposit fee to developer wallet FIRST (priority)
  UPDATE public.wallets 
  SET balance = balance + fee_amount 
  WHERE user_id = developer_id;
  
  -- Record developer fee transaction IMMEDIATELY
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
    'Automatic transaction fee collection',
    'completed'
  );
  
  -- STEP 3: Add net amount to recipient wallet
  UPDATE public.wallets 
  SET balance = balance + net_amount 
  WHERE user_id = recipient_id;
  
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
    'CLC transfer sent (10% fee auto-deducted)',
    'completed',
    recipient_address
  );
  
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
    'Received CLC transfer (after automatic fee deduction)',
    'completed'
  );
  
  -- STEP 4: If referrer exists, give them bonus from fee pool
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
      'Automatic referral bonus from transfer fees',
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
    'recipient_id', recipient_id,
    'fee_auto_deposited', true
  );
END;
$function$;