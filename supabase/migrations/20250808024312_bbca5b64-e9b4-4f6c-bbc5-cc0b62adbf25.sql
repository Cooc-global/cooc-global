-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'investor' CHECK (role IN ('developer', 'investor')),
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wallets table for CLC balances
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  locked_balance DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell', 'transfer_in', 'transfer_out', 'investment', 'withdrawal', 'daily_return', 'donation')),
  amount DECIMAL(20, 2) NOT NULL,
  from_address TEXT,
  to_address TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investments table
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 2) NOT NULL,
  daily_return DECIMAL(20, 2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn')),
  total_withdrawn DECIMAL(20, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily returns table
CREATE TABLE public.daily_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 2) NOT NULL,
  return_date DATE NOT NULL,
  withdrawn BOOLEAN NOT NULL DEFAULT false,
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exchange rates table
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_pair TEXT NOT NULL, -- e.g., 'CLC/KSH', 'CLC/USD'
  rate DECIMAL(20, 8) NOT NULL,
  set_by UUID NOT NULL REFERENCES auth.users(id),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for wallets
CREATE POLICY "Users can view their own wallet" ON public.wallets
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON public.wallets
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for investments
CREATE POLICY "Users can view their own investments" ON public.investments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments" ON public.investments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" ON public.investments
FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for daily returns
CREATE POLICY "Users can view their own daily returns" ON public.daily_returns
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily returns" ON public.daily_returns
FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for exchange rates (viewable by all, insertable by developers only)
CREATE POLICY "Anyone can view exchange rates" ON public.exchange_rates
FOR SELECT USING (true);

CREATE POLICY "Only developers can manage exchange rates" ON public.exchange_rates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'developer'
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  wallet_addr TEXT;
BEGIN
  -- Generate wallet address
  wallet_addr := '0x' || encode(gen_random_bytes(20), 'hex');
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, email, wallet_address)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.email,
    wallet_addr
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Insert developer account (initial setup)
INSERT INTO public.exchange_rates (currency_pair, rate, set_by, active)
VALUES ('CLC/KSH', 1.00, (SELECT id FROM auth.users LIMIT 1), true);

-- Create function to calculate daily returns
CREATE OR REPLACE FUNCTION public.calculate_daily_returns()
RETURNS void AS $$
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
    -- Check if return already calculated for today
    IF NOT EXISTS (
      SELECT 1 FROM public.daily_returns 
      WHERE investment_id = investment_record.id 
      AND return_date = return_date
    ) THEN
      -- Calculate 5% daily return
      return_amount := investment_record.amount * 0.05;
      
      -- Insert daily return record
      INSERT INTO public.daily_returns (
        investment_id, 
        user_id, 
        amount, 
        return_date
      ) VALUES (
        investment_record.id,
        investment_record.user_id,
        return_amount,
        return_date
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;