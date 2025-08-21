-- Update all fictional users to have 1000 coins and status 'sold'
UPDATE public.marketplace 
SET coins_for_sale = 1000.00,
    status = 'sold'
WHERE seller_name IN (
    'Grace Wanjiku', 
    'Peter Kiprotich', 
    'Mary Achieng', 
    'James Mwangi', 
    'Susan Nyokabi', 
    'Daniel Ochieng', 
    'Faith Wambui', 
    'Michael Kipchoge', 
    'Catherine Njeri'
);