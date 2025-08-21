-- Fix search path security issue for the functions we created
CREATE OR REPLACE FUNCTION public.calculate_daily_returns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
  investment_record RECORD;
  return_amount DECIMAL(20, 2);
  return_date DATE := CURRENT_DATE;
  developer_id UUID;
BEGIN
  -- Get developer user ID for fee tracking
  developer_id := public.get_developer_user_id();
  
  -- Loop through active investments
  FOR investment_record IN 
    SELECT * FROM public.investments 
    WHERE status = 'active' 
    AND end_date >= CURRENT_DATE
    AND start_date <= CURRENT_DATE
  LOOP
    -- Check if return already processed for today
    IF NOT EXISTS (
      SELECT 1 FROM public.daily_returns 
      WHERE investment_id = investment_record.id 
      AND return_date = return_date
    ) THEN
      -- Calculate 5% daily return
      return_amount := investment_record.amount * 0.05;
      
      -- STEP 1: Add return directly to investor wallet balance
      UPDATE public.wallets 
      SET balance = balance + return_amount
      WHERE user_id = investment_record.user_id;
      
      -- STEP 2: Record the daily return for tracking
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
      
      -- STEP 3: Record transaction for investor transparency
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
        'Daily 5% investment return automatically added to wallet',
        'completed'
      );
      
      -- STEP 4: Log the return processing for developer tracking
      IF developer_id IS NOT NULL THEN
        INSERT INTO public.transactions (
          user_id, 
          transaction_type, 
          amount, 
          description,
          status
        ) VALUES (
          developer_id,
          'return_processed',
          return_amount,
          CONCAT('Processed 5% daily return for investment ID: ', investment_record.id),
          'completed'
        );
      END IF;
      
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_daily_returns_now()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
DECLARE
  is_developer BOOLEAN := FALSE;
  processed_count INTEGER := 0;
  investment_record RECORD;
  return_amount DECIMAL(20, 2);
  return_date DATE := CURRENT_DATE;
BEGIN
  -- Check if current user is developer
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'developer'
  ) INTO is_developer;
  
  IF NOT is_developer THEN
    RETURN json_build_object('success', false, 'error', 'Access denied: Only developers can manually process returns');
  END IF;
  
  -- Process daily returns
  PERFORM public.calculate_daily_returns();
  
  -- Count how many returns were processed today
  SELECT COUNT(*) INTO processed_count
  FROM public.daily_returns
  WHERE return_date = return_date;
  
  RETURN json_build_object(
    'success', true, 
    'processed_count', processed_count,
    'message', 'Daily returns processed successfully'
  );
END;
$$;