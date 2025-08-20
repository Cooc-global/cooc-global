-- Fix security issue: Hide phone numbers from anonymous users in marketplace

-- Drop existing marketplace RLS policies that have the same condition for both auth states
DROP POLICY IF EXISTS "Anonymous can view marketplace offers without contact info" ON public.marketplace;
DROP POLICY IF EXISTS "Authenticated users can view marketplace offers with contact" ON public.marketplace;

-- Create secure RLS policies that properly handle phone number privacy

-- Policy for anonymous users: Can view marketplace offers but phone numbers are excluded via RPC function only
CREATE POLICY "Anonymous users can only use public RPC function" 
ON public.marketplace 
FOR SELECT 
USING (false); -- Deny direct table access for anonymous users

-- Policy for authenticated users: Can view all marketplace data including phone numbers
CREATE POLICY "Authenticated users can view full marketplace data" 
ON public.marketplace 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND status = 'active'
);

-- Update the public RPC function to ensure it only returns safe data
CREATE OR REPLACE FUNCTION public.get_marketplace_offers_public()
RETURNS TABLE(
  id UUID,
  user_id UUID,
  seller_name TEXT,
  coins_for_sale NUMERIC,
  price_per_coin NUMERIC,
  description TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
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
    -- Explicitly exclude phone_number for anonymous access
  FROM public.marketplace
  WHERE status = 'active'
  ORDER BY created_at DESC;
$$;