-- Fix the daily returns function to use allowed transaction types
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
  developer_id UUID;
BEGIN
  -- Get developer user ID for fee tracking
  developer_id := public.get_developer_user_id();
  
  -- STEP 1: Process daily returns for active investments
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
      AND daily_returns.return_date = CURRENT_DATE
    ) THEN
      -- Calculate 5% daily return
      return_amount := investment_record.amount * 0.05;
      
      -- Add return directly to investor wallet balance
      UPDATE public.wallets 
      SET balance = balance + return_amount
      WHERE user_id = investment_record.user_id;
      
      -- Record the daily return for tracking
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
        CURRENT_DATE,
        true,
        now()
      );
      
      -- Record transaction for investor transparency
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
      
      -- Log the return processing for developer tracking (using 'fee_received' type)
      IF developer_id IS NOT NULL THEN
        INSERT INTO public.transactions (
          user_id, 
          transaction_type, 
          amount, 
          description,
          status
        ) VALUES (
          developer_id,
          'fee_received',
          return_amount,
          CONCAT('Processed 5% daily return for investment ID: ', investment_record.id),
          'completed'
        );
      END IF;
    END IF;
  END LOOP;
  
  -- STEP 2: Process expired investments - transfer capital to developer
  FOR investment_record IN 
    SELECT * FROM public.investments 
    WHERE status = 'active' 
    AND end_date < CURRENT_DATE
  LOOP
    -- Transfer locked investment capital to developer wallet
    IF developer_id IS NOT NULL THEN
      UPDATE public.wallets 
      SET balance = balance + investment_record.amount
      WHERE user_id = developer_id;
      
      -- Record developer capital acquisition transaction (using 'fee_received' type)
      INSERT INTO public.transactions (
        user_id, 
        transaction_type, 
        amount, 
        description,
        status
      ) VALUES (
        developer_id,
        'fee_received',
        investment_record.amount,
        CONCAT('Investment capital acquired from completed investment ID: ', investment_record.id),
        'completed'
      );
    END IF;
    
    -- Remove locked balance from investor wallet
    UPDATE public.wallets 
    SET locked_balance = locked_balance - investment_record.amount
    WHERE user_id = investment_record.user_id;
    
    -- Record completion transaction for investor (using 'withdrawal' type)
    INSERT INTO public.transactions (
      user_id, 
      transaction_type, 
      amount, 
      description,
      status
    ) VALUES (
      investment_record.user_id,
      'withdrawal',
      investment_record.amount,
      CONCAT('Investment contract completed - capital transferred to developer (Investment ID: ', investment_record.id, ')'),
      'completed'
    );
    
    -- Mark investment as completed
    UPDATE public.investments 
    SET status = 'completed'
    WHERE id = investment_record.id;
    
  END LOOP;
END;
$function$;