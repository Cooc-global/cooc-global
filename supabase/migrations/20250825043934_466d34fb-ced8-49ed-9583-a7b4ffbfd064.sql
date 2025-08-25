-- Initialize CLC coin with base price of KSH 10
INSERT INTO public.exchange_rates (currency_pair, rate, active, set_by)
VALUES ('CLC/KSH', 10.00, true, (SELECT get_developer_user_id()));

-- Create function to update CLC price based on demand/supply
CREATE OR REPLACE FUNCTION public.update_clc_price_on_activity()
RETURNS TRIGGER AS $$
DECLARE
  current_price DECIMAL(10, 2);
  price_change DECIMAL(10, 2);
  new_price DECIMAL(10, 2);
  developer_id UUID;
BEGIN
  -- Get current CLC price
  SELECT rate INTO current_price 
  FROM public.exchange_rates 
  WHERE currency_pair = 'CLC/KSH' AND active = true
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If no price exists, set default
  IF current_price IS NULL THEN
    current_price := 10.00;
  END IF;
  
  -- Get developer ID
  developer_id := public.get_developer_user_id();
  
  -- Calculate price change based on activity type
  IF TG_OP = 'INSERT' THEN
    -- New marketplace offer (selling) - slight decrease in price due to increased supply
    price_change := -0.05;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'sold' AND OLD.status = 'active' THEN
    -- Offer sold - increase price due to demand
    price_change := NEW.coins_for_sale * 0.001; -- Small increase based on volume
  ELSIF TG_OP = 'DELETE' THEN
    -- Offer cancelled - slight price increase due to reduced supply
    price_change := 0.02;
  ELSE
    price_change := 0;
  END IF;
  
  -- Calculate new price with minimum floor of KSH 10
  new_price := GREATEST(current_price + price_change, 10.00);
  
  -- Insert new exchange rate if price changed significantly (more than 0.01)
  IF ABS(new_price - current_price) >= 0.01 THEN
    -- Deactivate old rate
    UPDATE public.exchange_rates 
    SET active = false 
    WHERE currency_pair = 'CLC/KSH' AND active = true;
    
    -- Insert new rate
    INSERT INTO public.exchange_rates (currency_pair, rate, active, set_by)
    VALUES ('CLC/KSH', new_price, true, developer_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update price on marketplace activity
CREATE OR REPLACE TRIGGER marketplace_price_update_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.marketplace
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clc_price_on_activity();

-- Create function to get current CLC price
CREATE OR REPLACE FUNCTION public.get_current_clc_price()
RETURNS DECIMAL(10, 2)
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT rate FROM public.exchange_rates 
     WHERE currency_pair = 'CLC/KSH' AND active = true 
     ORDER BY created_at DESC LIMIT 1), 
    10.00
  );
$$;