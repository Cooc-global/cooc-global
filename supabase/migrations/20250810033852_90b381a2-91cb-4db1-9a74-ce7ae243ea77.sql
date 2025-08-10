-- Create developer wallet with 1 billion coins
DO $$
DECLARE
    developer_user_id UUID;
    developer_wallet_addr TEXT;
BEGIN
    -- Check if developer already exists
    SELECT user_id INTO developer_user_id 
    FROM public.profiles 
    WHERE role = 'developer' 
    LIMIT 1;
    
    -- If no developer exists, create one
    IF developer_user_id IS NULL THEN
        -- Generate developer wallet address
        developer_wallet_addr := '0x' || substring(md5('developer' || clock_timestamp()::text) from 1 for 40);
        
        -- Insert developer profile (without user_id from auth since it's system-created)
        INSERT INTO public.profiles (user_id, full_name, email, wallet_address, role)
        VALUES (
            gen_random_uuid(),
            'System Developer',
            'developer@system.com',
            developer_wallet_addr,
            'developer'
        )
        RETURNING user_id INTO developer_user_id;
        
        -- Create developer wallet with 1 billion coins
        INSERT INTO public.wallets (user_id, balance, locked_balance)
        VALUES (developer_user_id, 1000000000.00, 0.00);
    ELSE
        -- If developer exists, update their balance to 1 billion
        UPDATE public.wallets 
        SET balance = 1000000000.00 
        WHERE user_id = developer_user_id;
    END IF;
END $$;

-- Create function to get developer wallet user_id
CREATE OR REPLACE FUNCTION public.get_developer_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT user_id FROM public.profiles WHERE role = 'developer' LIMIT 1;
$$;

-- Create function to process transaction with 10% fee
CREATE OR REPLACE FUNCTION public.process_transfer_with_fee(
  sender_id UUID,
  recipient_address TEXT,
  amount DECIMAL(20, 2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Record fee transaction
  INSERT INTO public.transactions (
    user_id, 
    transaction_type, 
    amount, 
    description,
    status
  ) VALUES (
    developer_id,
    'fee',
    fee_amount,
    'Transaction fee collected',
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