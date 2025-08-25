-- Add delete policy for developers on announcements table
CREATE POLICY "Developers can delete their own announcements" 
ON public.announcements 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'developer'
  ) 
  AND auth.uid() = created_by
);