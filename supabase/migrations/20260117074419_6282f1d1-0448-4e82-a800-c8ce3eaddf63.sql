-- Add custom_tips column to profiles for user-defined motivational tips
ALTER TABLE public.profiles 
ADD COLUMN custom_tips text[] DEFAULT '{}'::text[];