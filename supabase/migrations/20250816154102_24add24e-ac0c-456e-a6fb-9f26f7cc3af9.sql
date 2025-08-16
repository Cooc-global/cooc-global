-- Create marketplace table for coin sale offers
CREATE TABLE public.marketplace (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seller_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  coins_for_sale DECIMAL(20, 2) NOT NULL,
  price_per_coin DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view marketplace offers" 
ON public.marketplace 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Users can create their own offers" 
ON public.marketplace 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own offers" 
ON public.marketplace 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own offers" 
ON public.marketplace 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_marketplace_updated_at
BEFORE UPDATE ON public.marketplace
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();