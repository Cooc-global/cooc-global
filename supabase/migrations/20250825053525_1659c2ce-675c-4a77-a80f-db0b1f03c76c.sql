-- Insert fictional marketplace offers using the developer's user_id but with fictional seller names
-- This will create the appearance of multiple users while using existing accounts

-- Get the developer user ID
DO $$
DECLARE
    dev_user_id UUID;
BEGIN
    -- Get developer user ID
    SELECT user_id INTO dev_user_id FROM public.profiles WHERE role = 'developer' LIMIT 1;
    
    -- Insert fictional marketplace offers
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
    -- Active offers with fictional names and Safaricom numbers
    (dev_user_id, 'Mary Wanjiku', '+254 0712345678', 15000, 12.50, 'KSH', 'active', 
     '[{"type": "phone", "details": "+254 0712345678", "label": "M-Pesa"}]'::jsonb, 
     now() - interval '2 hours'),
    
    (dev_user_id, 'John Kipchoge', '+254 0723456789', 8500, 11.75, 'KSH', 'active',
     '[{"type": "phone", "details": "+254 0723456789", "label": "M-Pesa"}]'::jsonb,
     now() - interval '4 hours'),
    
    (dev_user_id, 'Grace Achieng', '+254 0734567890', 22000, 13.00, 'KSH', 'active',
     '[{"type": "phone", "details": "+254 0734567890", "label": "M-Pesa"}]'::jsonb,
     now() - interval '6 hours'),
    
    (dev_user_id, 'Peter Mutua', '+254 0745678901', 5500, 11.25, 'KSH', 'active',
     '[{"type": "phone", "details": "+254 0745678901", "label": "M-Pesa"}]'::jsonb,
     now() - interval '8 hours'),
    
    -- Recent sold offers (as shown in the image)
    (dev_user_id, 'Evans Kiprotich', '+254 0704160***', 1200, 1.00, 'KSH', 'sold',
     '[{"type": "phone", "details": "+254 0704160***", "label": "M-Pesa"}]'::jsonb,
     now() - interval '1 day'),
    
    (dev_user_id, 'James Mwangi', '0745678***', 5000, 10.80, 'KSH', 'sold',
     '[{"type": "phone", "details": "0745678***", "label": "M-Pesa"}]'::jsonb,
     now() - interval '2 days'),
    
    (dev_user_id, 'Sarah Njeri', '+254 0756789***', 3500, 11.20, 'KSH', 'sold',
     '[{"type": "phone", "details": "+254 0756789***", "label": "M-Pesa"}]'::jsonb,
     now() - interval '3 days'),
    
    (dev_user_id, 'David Ochieng', '+254 0767890***', 7800, 10.95, 'KSH', 'sold',
     '[{"type": "phone", "details": "+254 0767890***", "label": "M-Pesa"}]'::jsonb,
     now() - interval '4 days'),
    
    (dev_user_id, 'Anne Waweru', '+254 0778901***', 12000, 12.30, 'KSH', 'sold',
     '[{"type": "phone", "details": "+254 0778901***", "label": "M-Pesa"}]'::jsonb,
     now() - interval '5 days');
     
END $$;