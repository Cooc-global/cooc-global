-- Set developer wallet balance to 1 trillion coins (simplified)

UPDATE public.wallets 
SET balance = 1000000000000.00
WHERE user_id = (
  SELECT user_id 
  FROM public.profiles 
  WHERE role = 'developer' 
  LIMIT 1
);