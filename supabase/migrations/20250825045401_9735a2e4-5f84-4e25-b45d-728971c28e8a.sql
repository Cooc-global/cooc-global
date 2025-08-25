-- Drop and recreate the public RPC function to include payment_methods
DROP FUNCTION public.get_marketplace_offers_public();

CREATE OR REPLACE FUNCTION public.get_marketplace_offers_public()
 RETURNS TABLE(id uuid, user_id uuid, seller_name text, coins_for_sale numeric, price_per_coin numeric, description text, status text, created_at timestamp with time zone, updated_at timestamp with time zone, payment_methods jsonb)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    id,
    user_id,
    seller_name,
    coins_for_sale,
    price_per_coin,
    description,
    status,
    created_at,
    updated_at,
    payment_methods
    -- Still exclude phone_number for anonymous access
  FROM public.marketplace
  WHERE status = 'active'
  ORDER BY created_at DESC;
$function$