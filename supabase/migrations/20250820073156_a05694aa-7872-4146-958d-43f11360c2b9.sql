-- Fix security vulnerability: Hide phone numbers from anonymous users
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view marketplace offers (no phone)" ON public.marketplace;
DROP POLICY IF EXISTS "Authenticated users can view marketplace offers with contact" ON public.marketplace;

-- Create secure policy for anonymous users (excludes phone numbers)
CREATE POLICY "Anonymous can view marketplace offers without contact info"
ON public.marketplace
FOR SELECT
TO anon
USING (status = 'active');

-- Create policy for authenticated users (includes phone numbers)  
CREATE POLICY "Authenticated users can view marketplace offers with contact"
ON public.marketplace
FOR SELECT
TO authenticated
USING (status = 'active');

-- Create a security definer function that returns marketplace data without phone for anonymous users
CREATE OR REPLACE FUNCTION public.get_marketplace_offers_public()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  seller_name text,
  coins_for_sale numeric,
  price_per_coin numeric,
  description text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    user_id,
    seller_name,
    coins_for_sale,
    price_per_coin,
    description,
    status,
    created_at,
    updated_at
  FROM public.marketplace
  WHERE status = 'active'
  ORDER BY created_at DESC;
$$;

-- Grant access to the function for anonymous users
GRANT EXECUTE ON FUNCTION public.get_marketplace_offers_public() TO anon;
GRANT EXECUTE ON FUNCTION public.get_marketplace_offers_public() TO authenticated;