-- Set developer wallet balance to 1 trillion coins

UPDATE public.wallets 
SET balance = 1000000000000.00
WHERE user_id = (
  SELECT user_id 
  FROM public.profiles 
  WHERE role = 'developer' 
  LIMIT 1
);

-- Also record this as a transaction for audit purposes
INSERT INTO public.transactions (
  user_id,
  transaction_type,
  amount,
  description,
  status
) 
SELECT 
  user_id,
  'system_grant',
  1000000000000.00,
  'Developer wallet balance set to 1 trillion coins',
  'completed'
FROM public.profiles 
WHERE role = 'developer' 
LIMIT 1;