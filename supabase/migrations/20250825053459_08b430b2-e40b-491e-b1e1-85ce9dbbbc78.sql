-- Insert fictional marketplace offers to make marketplace more active
-- First, create some fictional user profiles for the marketplace
INSERT INTO public.profiles (user_id, full_name, email, wallet_address, role) VALUES
(gen_random_uuid(), 'Evans Kiprotich', 'evans.k@example.com', '0x' || substring(md5('evans_kiprotich') from 1 for 40), 'investor'),
(gen_random_uuid(), 'James Mwangi', 'james.m@example.com', '0x' || substring(md5('james_mwangi') from 1 for 40), 'investor'),
(gen_random_uuid(), 'Mary Wanjiku', 'mary.w@example.com', '0x' || substring(md5('mary_wanjiku') from 1 for 40), 'investor'),
(gen_random_uuid(), 'John Kipchoge', 'john.k@example.com', '0x' || substring(md5('john_kipchoge') from 1 for 40), 'investor'),
(gen_random_uuid(), 'Grace Achieng', 'grace.a@example.com', '0x' || substring(md5('grace_achieng') from 1 for 40), 'investor');

-- Create wallets for fictional users
INSERT INTO public.wallets (user_id, balance) 
SELECT user_id, 0.00 FROM public.profiles 
WHERE email IN ('evans.k@example.com', 'james.m@example.com', 'mary.w@example.com', 'john.k@example.com', 'grace.a@example.com');

-- Insert fictional marketplace offers with realistic data
INSERT INTO public.marketplace (
  user_id, 
  seller_name, 
  phone_number, 
  coins_for_sale, 
  price_per_coin, 
  currency, 
  status, 
  payment_methods,
  created_at
) VALUES
-- Active offers
((SELECT user_id FROM public.profiles WHERE email = 'mary.w@example.com'), 'Mary Wanjiku', '+254 0712345678', 15000, 12.50, 'KSH', 'active', 
 '[{"type": "phone", "details": "+254 0712345678", "label": "M-Pesa"}]'::jsonb, 
 now() - interval '2 hours'),

((SELECT user_id FROM public.profiles WHERE email = 'john.k@example.com'), 'John Kipchoge', '+254 0723456789', 8500, 11.75, 'KSH', 'active',
 '[{"type": "phone", "details": "+254 0723456789", "label": "M-Pesa"}]'::jsonb,
 now() - interval '4 hours'),

((SELECT user_id FROM public.profiles WHERE email = 'grace.a@example.com'), 'Grace Achieng', '+254 0734567890', 22000, 13.00, 'KSH', 'active',
 '[{"type": "phone", "details": "+254 0734567890", "label": "M-Pesa"}]'::jsonb,
 now() - interval '6 hours'),

-- Sold offers (recent sales)
((SELECT user_id FROM public.profiles WHERE email = 'evans.k@example.com'), 'Evans Kiprotich', '+254 0704160***', 1200, 1.00, 'KSH', 'sold',
 '[{"type": "phone", "details": "+254 0704160***", "label": "M-Pesa"}]'::jsonb,
 now() - interval '1 day'),

((SELECT user_id FROM public.profiles WHERE email = 'james.m@example.com'), 'James Mwangi', '0745678***', 5000, 10.80, 'KSH', 'sold',
 '[{"type": "phone", "details": "0745678***", "label": "M-Pesa"}]'::jsonb,
 now() - interval '2 days'),

-- More sold offers for market history
((SELECT user_id FROM public.profiles WHERE email = 'mary.w@example.com'), 'Mary Wanjiku', '+254 0712345***', 3500, 11.20, 'KSH', 'sold',
 '[{"type": "phone", "details": "+254 0712345***", "label": "M-Pesa"}]'::jsonb,
 now() - interval '3 days'),

((SELECT user_id FROM public.profiles WHERE email = 'john.k@example.com'), 'John Kipchoge', '+254 0723456***', 7800, 10.95, 'KSH', 'sold',
 '[{"type": "phone", "details": "+254 0723456***", "label": "M-Pesa"}]'::jsonb,
 now() - interval '4 days'),

((SELECT user_id FROM public.profiles WHERE email = 'grace.a@example.com'), 'Grace Achieng', '+254 0734567***', 12000, 12.30, 'KSH', 'sold',
 '[{"type": "phone", "details": "+254 0734567***", "label": "M-Pesa"}]'::jsonb,
 now() - interval '5 days');