-- Add plan field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' 
CHECK (plan IN ('free', 'plus'));