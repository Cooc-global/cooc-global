-- Insert fictional marketplace offers with proper phone number formats
DO $$
DECLARE
    dev_user_id UUID;
BEGIN
    -- Get developer user ID
    SELECT user_id INTO dev_user_id FROM public.profiles WHERE role = 'developer' LIMIT 1;
    
    -- Insert fictional marketplace offers with valid phone formats
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
    -- Active offers with fictional names and valid Safaricom numbers
    (dev_user_id, 'Mary Wanjiku', '+254712345678', 15000, 12.50, 'KSH', 'active', 
     '[{"type": "phone", "details": "+254712345678", "label": "M-Pesa"}]'::jsonb, 
     now() - interval '2 hours'),
    
    (dev_user_id, 'John Kipchoge', '+254723456789', 8500, 11.75, 'KSH', 'active',
     '[{"type": "phone", "details": "+254723456789", "label": "M-Pesa"}]'::jsonb,
     now() - interval '4 hours'),
    
    (dev_user_id, 'Grace Achieng', '+254734567890', 22000, 13.00, 'KSH', 'active',
     '[{"type": "phone", "details": "+254734567890", "label": "M-Pesa"}]'::jsonb,
     now() - interval '6 hours'),
    
    (dev_user_id, 'Peter Mutua', '+254745678901', 5500, 11.25, 'KSH', 'active',
     '[{"type": "phone", "details": "+254745678901", "label": "M-Pesa"}]'::jsonb,
     now() - interval '8 hours'),
    
    -- Recent sold offers (matching the image style with partial phone numbers)
    (dev_user_id, 'Evans Kiprotich', '+254704160123', 1200, 1.00, 'KSH', 'sold',
     '[{"type": "phone", "details": "+254704160123", "label": "M-Pesa"}]'::jsonb,
     now() - interval '1 day'),
    
    (dev_user_id, 'James Mwangi', '0745678123', 5000, 10.80, 'KSH', 'sold',
     '[{"type": "phone", "details": "0745678123", "label": "M-Pesa"}]'::jsonb,
     now() - interval '2 days'),
    
    (dev_user_id, 'Sarah Njeri', '+254756789123', 3500, 11.20, 'KSH', 'sold',
     '[{"type": "phone", "details": "+254756789123", "label": "M-Pesa"}]'::jsonb,
     now() - interval '3 days'),
    
    (dev_user_id, 'David Ochieng', '+254767890123', 7800, 10.95, 'KSH', 'sold',
     '[{"type": "phone", "details": "+254767890123", "label": "M-Pesa"}]'::jsonb,
     now() - interval '4 days'),
    
    (dev_user_id, 'Anne Waweru', '+254778901123', 12000, 12.30, 'KSH', 'sold',
     '[{"type": "phone", "details": "+254778901123", "label": "M-Pesa"}]'::jsonb,
     now() - interval '5 days');

END $$;