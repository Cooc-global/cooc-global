-- Update phone numbers to use *** instead of 000 for concealment
UPDATE public.marketplace 
SET phone_number = REPLACE(phone_number, '000', '***')
WHERE phone_number LIKE '%000';