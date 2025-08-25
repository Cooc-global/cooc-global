-- Create table for developer announcements to investors
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_by JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Developers can create announcements
CREATE POLICY "Developers can create announcements" 
ON public.announcements 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'developer'
  )
  AND auth.uid() = created_by
);

-- Developers can view all announcements
CREATE POLICY "Developers can view all announcements" 
ON public.announcements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'developer'
  )
);

-- Investors can view all announcements
CREATE POLICY "Investors can view announcements" 
ON public.announcements 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'investor'
  )
);

-- Investors can update read status
CREATE POLICY "Investors can update read status" 
ON public.announcements 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'investor'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'investor'
  )
);