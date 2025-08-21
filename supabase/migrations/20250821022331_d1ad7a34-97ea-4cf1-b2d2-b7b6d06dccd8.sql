-- Update sample marketplace data with Kenyan names and Safaricom numbers
-- First clear existing sample data
DELETE FROM public.marketplace WHERE seller_name IN ('Sarah Johnson', 'Mike Rodriguez', 'Jennifer Liu', 'David Thompson', 'Amanda Chen', 'Robert Smith', 'Lisa Martinez', 'Kevin Park', 'Emily Davis');

-- Insert updated sample data with Kenyan names and Safaricom numbers
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
  '+254 712 345 XXX',
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
  '+254 723 456 XXX',
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
  '+254 734 567 XXX',
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
  '+254 745 678 XXX',
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
  '+254 756 789 XXX',
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
  '+254 767 890 XXX',
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
  '+254 778 901 XXX',
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
  '+254 789 012 XXX',
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
  '+254 701 234 XXX',
  125.75,
  1.32,
  'SOLD - Amazing response from investors!',
  'sold',
  now() - interval '2 days 6 hours',
  now() - interval '12 hours'
);