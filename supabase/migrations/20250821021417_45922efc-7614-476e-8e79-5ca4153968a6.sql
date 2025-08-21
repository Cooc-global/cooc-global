-- Create sample marketplace data to attract investors
-- Generate fake user IDs for sample marketplace entries
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
  'Sarah Johnson',
  '+1-555-0123',
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
  'Mike Rodriguez',
  '+1-555-0456',
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
  'Jennifer Liu',
  '+1-555-0789',
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
  'David Thompson',
  '+1-555-0321',
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
  'Amanda Chen',
  '+1-555-0654',
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
  'Robert Smith',
  '+1-555-0987',
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
  'Lisa Martinez',
  '+1-555-0147',
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
  'Kevin Park',
  '+1-555-0258',
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
  'Emily Davis',
  '+1-555-0369',
  125.75,
  1.32,
  'SOLD - Amazing response from investors!',
  'sold',
  now() - interval '2 days 6 hours',
  now() - interval '12 hours'
);