-- Add currency support to marketplace table
ALTER TABLE public.marketplace 
ADD COLUMN currency TEXT DEFAULT 'KSH' NOT NULL;

-- Add currency support to exchange_rates table (rename currency_pair to be more flexible)
-- First create new exchange rates structure
CREATE TABLE public.currency_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  set_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_currency, to_currency, active) WHERE active = true
);

-- Enable RLS on currency_rates
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Create policies for currency_rates
CREATE POLICY "Anyone can view currency rates" 
ON public.currency_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Only developers can manage currency rates" 
ON public.currency_rates 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'developer'
));

-- Insert default currency rates (USD as base currency)
INSERT INTO public.currency_rates (from_currency, to_currency, rate, set_by) VALUES
('USD', 'KSH', 129.50, (SELECT get_developer_user_id())),
('USD', 'EUR', 0.85, (SELECT get_developer_user_id())),
('USD', 'GBP', 0.73, (SELECT get_developer_user_id())),
('USD', 'NGN', 1650.00, (SELECT get_developer_user_id())),
('USD', 'ZAR', 18.20, (SELECT get_developer_user_id())),
('USD', 'GHS', 15.80, (SELECT get_developer_user_id())),
('USD', 'UGX', 3700.00, (SELECT get_developer_user_id())),
('USD', 'TZS', 2520.00, (SELECT get_developer_user_id()));

-- Insert reverse rates for easy conversion
INSERT INTO public.currency_rates (from_currency, to_currency, rate, set_by) VALUES
('KSH', 'USD', 1/129.50, (SELECT get_developer_user_id())),
('EUR', 'USD', 1/0.85, (SELECT get_developer_user_id())),
('GBP', 'USD', 1/0.73, (SELECT get_developer_user_id())),
('NGN', 'USD', 1/1650.00, (SELECT get_developer_user_id())),
('ZAR', 'USD', 1/18.20, (SELECT get_developer_user_id())),
('GHS', 'USD', 1/15.80, (SELECT get_developer_user_id())),
('UGX', 'USD', 1/3700.00, (SELECT get_developer_user_id())),
('TZS', 'USD', 1/2520.00, (SELECT get_developer_user_id()));

-- Create function to get currency rate
CREATE OR REPLACE FUNCTION public.get_currency_rate(from_curr TEXT, to_curr TEXT)
RETURNS NUMERIC
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT rate FROM public.currency_rates 
     WHERE from_currency = from_curr AND to_currency = to_curr AND active = true 
     ORDER BY created_at DESC LIMIT 1), 
    1.0
  );
$$;

-- Create function to convert currency amounts
CREATE OR REPLACE FUNCTION public.convert_currency(amount NUMERIC, from_curr TEXT, to_curr TEXT)
RETURNS NUMERIC
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT amount * get_currency_rate(from_curr, to_curr);
$$;