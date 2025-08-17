-- Modify the calculate_daily_returns function to directly add to wallet balance
CREATE OR REPLACE FUNCTION public.calculate_daily_returns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  investment_record RECORD;
  return_amount DECIMAL(20, 2);
  return_date DATE := CURRENT_DATE;
BEGIN
  -- Loop through active investments
  FOR investment_record IN 
    SELECT * FROM public.investments 
    WHERE status = 'active' 
    AND end_date >= CURRENT_DATE
    AND start_date < CURRENT_DATE
  LOOP
    -- Check if return already processed for today
    IF NOT EXISTS (
      SELECT 1 FROM public.daily_returns 
      WHERE investment_id = investment_record.id 
      AND return_date = return_date
    ) THEN
      -- Calculate 5% daily return
      return_amount := investment_record.amount * 0.05;
      
      -- Add return directly to wallet balance
      UPDATE public.wallets 
      SET balance = balance + return_amount
      WHERE user_id = investment_record.user_id;
      
      -- Record the daily return for tracking (but already processed)
      INSERT INTO public.daily_returns (
        investment_id, 
        user_id, 
        amount, 
        return_date,
        withdrawn,
        withdrawn_at
      ) VALUES (
        investment_record.id,
        investment_record.user_id,
        return_amount,
        return_date,
        true,
        now()
      );
      
      -- Record transaction for transparency
      INSERT INTO public.transactions (
        user_id, 
        transaction_type, 
        amount, 
        description,
        status
      ) VALUES (
        investment_record.user_id,
        'daily_return',
        return_amount,
        'Daily investment return automatically added to wallet',
        'completed'
      );
    END IF;
  END LOOP;
END;
$function$;