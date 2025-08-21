-- Update phone numbers to use 999 instead of 000 to simulate concealed digits
UPDATE public.marketplace 
SET phone_number = REPLACE(phone_number, '000', '999')
WHERE phone_number LIKE '%000';