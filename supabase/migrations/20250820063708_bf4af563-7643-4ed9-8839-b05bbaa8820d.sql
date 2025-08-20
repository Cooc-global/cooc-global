-- Update transaction type constraint to include fee_received and referral_bonus
ALTER TABLE public.transactions 
DROP CONSTRAINT transactions_transaction_type_check;

ALTER TABLE public.transactions 
ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY[
  'buy'::text, 
  'sell'::text, 
  'transfer_in'::text, 
  'transfer_out'::text, 
  'investment'::text, 
  'withdrawal'::text, 
  'daily_return'::text, 
  'donation'::text,
  'fee_received'::text,
  'referral_bonus'::text
]));