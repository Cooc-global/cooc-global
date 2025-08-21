-- Update sample marketplace data with Kenyan names and valid Safaricom numbers
-- First clear existing sample data
DELETE FROM public.marketplace WHERE seller_name IN ('Sarah Johnson', 'Mike Rodriguez', 'Jennifer Liu', 'David Thompson', 'Amanda Chen', 'Robert Smith', 'Lisa Martinez', 'Kevin Park', 'Emily Davis');

-- Insert updated sample data with Kenyan names and Safaricom numbers (using 000 for last digits to simulate concealment)
INSERT INTO public.marketplace (
  id,
  user_id,
  seller_name,
  phone_number,
  coins_for_sale,
  price_per_coin,
  description,
  status,
  created_at,
  updated_at
) VALUES 
-- Active listings (currently for sale)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Grace Wanjiku',
  '0712345000',
  150.00,
  1.25,
  'Selling my CLC coins due to unexpected expenses. Quick sale needed!',
  'active',
  now() - interval '2 hours',
  now() - interval '2 hours'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Peter Kiprotich',
  '0723456000',
  500.00,
  1.20,
  'Bulk sale - 500 CLC at great price. Serious buyers only.',
  'active',
  now() - interval '4 hours',
  now() - interval '4 hours'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Mary Achieng',
  '0734567000',
  75.50,
  1.30,
  'Small batch of coins for sale. Perfect for new investors.',
  'active',
  now() - interval '1 hour',
  now() - interval '1 hour'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'James Mwangi',
  '0745678000',
  300.00,
  1.22,
  'Moving abroad, need to liquidate my CLC position quickly.',
  'active',
  now() - interval '30 minutes',
  now() - interval '30 minutes'
),

-- Recently sold listings (to show market activity)
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Susan Nyokabi',
  '0756789000',
  200.00,
  1.28,
  'SOLD - Thanks for the quick transaction!',
  'sold',
  now() - interval '1 day',
  now() - interval '3 hours'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Daniel Ochieng',
  '0767890000',
  450.00,
  1.15,
  'SOLD - Great buyer, smooth process.',
  'sold',
  now() - interval '2 days',
  now() - interval '5 hours'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Faith Wambui',
  '0778901000',
  100.00,
  1.35,
  'SOLD - Fastest sale ever! CLC is in high demand.',
  'sold',
  now() - interval '1 day 12 hours',
  now() - interval '8 hours'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Michael Kipchoge',
  '0789012000',
  350.00,
  1.18,
  'SOLD - Multiple offers received within hours!',
  'sold',
  now() - interval '3 days',
  now() - interval '1 day'
),
(
  gen_random_uuid(),
  gen_random_uuid(),
  'Catherine Njeri',
  '0701234000',
  125.75,
  1.32,
  'SOLD - Amazing response from investors!',
  'sold',
  now() - interval '2 days 6 hours',
  now() - interval '12 hours'
);