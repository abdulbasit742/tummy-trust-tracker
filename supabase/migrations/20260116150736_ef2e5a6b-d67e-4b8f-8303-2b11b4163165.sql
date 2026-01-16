-- 1. Add DELETE policy to profiles table
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Add UPDATE policy to analytics_events
CREATE POLICY "Users can update their own analytics events"
ON public.analytics_events
FOR UPDATE
USING (auth.uid() = user_id);

-- 3. Add DELETE policy to analytics_events
CREATE POLICY "Users can delete their own analytics events"
ON public.analytics_events
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Add CASCADE DELETE for symptom_logs when meal_logs are deleted
ALTER TABLE public.symptom_logs
DROP CONSTRAINT IF EXISTS symptom_logs_meal_log_id_fkey;

ALTER TABLE public.symptom_logs
ADD CONSTRAINT symptom_logs_meal_log_id_fkey
FOREIGN KEY (meal_log_id)
REFERENCES public.meal_logs(id)
ON DELETE CASCADE;