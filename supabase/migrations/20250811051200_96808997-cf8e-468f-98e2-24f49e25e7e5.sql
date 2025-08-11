-- Set developer wallet to have 1 billion coins as system supply
UPDATE wallets 
SET balance = 1000000000.00 
WHERE user_id = (
  SELECT user_id 
  FROM profiles 
  WHERE role = 'developer' 
  LIMIT 1
);