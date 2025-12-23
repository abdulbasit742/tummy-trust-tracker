-- Add free_access_expiry column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS free_access_expiry TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '6 months');

-- Update existing profiles to have plus plan and 6 month expiry
UPDATE public.profiles 
SET plan = 'plus', 
    free_access_expiry = now() + interval '6 months' 
WHERE plan = 'free' OR free_access_expiry IS NULL;