-- Create dynamic pricing system with demand-based rates
-- First, ensure we have a base KSH exchange rate
INSERT INTO public.exchange_rates (currency_pair, rate, set_by, active)
SELECT 'CLC/KSH', 1.00, user_id, true
FROM public.profiles 
WHERE role = 'developer' 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create function to calculate dynamic exchange rate based on demand
CREATE OR REPLACE FUNCTION public.calculate_dynamic_exchange_rate()
RETURNS TRIGGER AS $$
DECLARE
  transaction_volume DECIMAL(20, 2);
  marketplace_activity INTEGER;
  investment_volume DECIMAL(20, 2);
  demand_multiplier DECIMAL(10, 4);
  new_rate DECIMAL(10, 4);
  developer_id UUID;
BEGIN
  -- Get developer ID
  SELECT user_id INTO developer_id FROM public.profiles WHERE role = 'developer' LIMIT 1;
  
  -- Calculate transaction volume in last 24 hours
  SELECT COALESCE(SUM(amount), 0) INTO transaction_volume
  FROM public.transactions 
  WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND transaction_type IN ('transfer', 'purchase');
  
  -- Calculate marketplace activity (active offers)
  SELECT COUNT(*) INTO marketplace_activity
  FROM public.marketplace 
  WHERE status = 'active'
  AND created_at >= NOW() - INTERVAL '24 hours';
  
  -- Calculate investment volume in last 24 hours
  SELECT COALESCE(SUM(amount), 0) INTO investment_volume
  FROM public.investments 
  WHERE created_at >= NOW() - INTERVAL '24 hours';
  
  -- Calculate demand multiplier (minimum 1.0, increases with activity)
  demand_multiplier := 1.0 + 
    (transaction_volume / 100000.0) * 0.1 + 
    (marketplace_activity::DECIMAL / 10.0) * 0.05 + 
    (investment_volume / 50000.0) * 0.15;
  
  -- Ensure minimum rate of 1.00 KSH
  new_rate := GREATEST(1.00, demand_multiplier);
  
  -- Update the exchange rate
  UPDATE public.exchange_rates 
  SET rate = new_rate, 
      created_at = NOW()
  WHERE currency_pair = 'CLC/KSH' 
  AND active = true
  AND set_by = developer_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update exchange rate on relevant activities
CREATE OR REPLACE TRIGGER update_rate_on_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_dynamic_exchange_rate();

CREATE OR REPLACE TRIGGER update_rate_on_marketplace
  AFTER INSERT OR UPDATE ON public.marketplace
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_dynamic_exchange_rate();

CREATE OR REPLACE TRIGGER update_rate_on_investment
  AFTER INSERT ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_dynamic_exchange_rate();

-- Initial calculation of exchange rate
SELECT public.calculate_dynamic_exchange_rate();