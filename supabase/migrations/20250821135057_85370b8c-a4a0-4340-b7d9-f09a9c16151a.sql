-- Fix the process_daily_returns_now function to be VOLATILE instead of STABLE
CREATE OR REPLACE FUNCTION public.process_daily_returns_now()
 RETURNS json
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE daily_returns.return_date = CURRENT_DATE;
  
  RETURN json_build_object(
    'success', true, 
    'processed_count', processed_count,
    'message', 'Daily returns processed successfully'
  );
END;
$function$