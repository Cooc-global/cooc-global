-- Update RLS policy to allow authenticated users to see both active and sold marketplace records
DROP POLICY IF EXISTS "Authenticated users can view full marketplace data" ON public.marketplace;

CREATE POLICY "Authenticated users can view all marketplace data" 
ON public.marketplace 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND status IN ('active', 'sold'));