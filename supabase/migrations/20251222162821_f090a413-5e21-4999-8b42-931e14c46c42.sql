-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  ibs_type TEXT NOT NULL CHECK (ibs_type IN ('IBS-C', 'IBS-D', 'IBS-M')),
  severity TEXT NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe')),
  symptoms TEXT[] DEFAULT '{}',
  trigger_sensitivities TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_reference table (public read, admin write)
CREATE TABLE public.food_reference (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  default_status TEXT NOT NULL CHECK (default_status IN ('safe', 'caution', 'avoid')),
  fodmap_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_logs table
CREATE TABLE public.meal_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  portion TEXT NOT NULL CHECK (portion IN ('S', 'M', 'L')),
  eaten_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create symptom_logs table
CREATE TABLE public.symptom_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_log_id UUID NOT NULL REFERENCES public.meal_logs(id) ON DELETE CASCADE,
  bloating_0_10 INTEGER NOT NULL CHECK (bloating_0_10 >= 0 AND bloating_0_10 <= 10),
  pain_0_10 INTEGER NOT NULL CHECK (pain_0_10 >= 0 AND pain_0_10 <= 10),
  stool_issue BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_reference ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Food reference policies (public read)
CREATE POLICY "Anyone can view food reference" ON public.food_reference
  FOR SELECT USING (true);

-- Meal logs policies
CREATE POLICY "Users can view their own meal logs" ON public.meal_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal logs" ON public.meal_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs" ON public.meal_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs" ON public.meal_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Symptom logs policies (via meal_log ownership)
CREATE POLICY "Users can view their own symptom logs" ON public.symptom_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.meal_logs WHERE meal_logs.id = symptom_logs.meal_log_id AND meal_logs.user_id = auth.uid())
  );

CREATE POLICY "Users can insert symptom logs for their meals" ON public.symptom_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.meal_logs WHERE meal_logs.id = meal_log_id AND meal_logs.user_id = auth.uid())
  );

CREATE POLICY "Users can update their own symptom logs" ON public.symptom_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.meal_logs WHERE meal_logs.id = symptom_logs.meal_log_id AND meal_logs.user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own symptom logs" ON public.symptom_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.meal_logs WHERE meal_logs.id = symptom_logs.meal_log_id AND meal_logs.user_id = auth.uid())
  );

-- Insert default food reference data
INSERT INTO public.food_reference (name, default_status, fodmap_note) VALUES
  ('Rice', 'safe', 'Low FODMAP, easy to digest'),
  ('Chicken', 'safe', 'Plain grilled chicken is well-tolerated'),
  ('Eggs', 'safe', 'Excellent protein, generally safe'),
  ('Banana', 'safe', 'Ripe bananas are low FODMAP'),
  ('Spinach', 'safe', 'Nutrient-dense, low FODMAP'),
  ('Oats', 'safe', 'Gentle on the stomach when plain'),
  ('Salmon', 'safe', 'Rich in omega-3s, anti-inflammatory'),
  ('Potato', 'safe', 'Plain potatoes are well-tolerated'),
  ('Blueberries', 'safe', 'Low FODMAP in reasonable portions'),
  ('Carrots', 'safe', 'Cooked carrots are easily digested'),
  ('Zucchini', 'safe', 'Low FODMAP vegetable'),
  ('Turkey', 'safe', 'Lean protein, easily digested'),
  ('Quinoa', 'safe', 'Gluten-free grain alternative'),
  ('Cucumber', 'safe', 'Hydrating and easy to digest'),
  ('Maple Syrup', 'safe', 'Low FODMAP sweetener'),
  ('Lactose-Free Milk', 'safe', 'Safe dairy alternative'),
  ('Avocado', 'caution', 'Small portions (1/8) are low FODMAP'),
  ('Broccoli', 'caution', 'Heads are higher FODMAP than stalks'),
  ('Milk', 'caution', 'Contains lactose, try lactose-free'),
  ('Apple', 'caution', 'High in fructose and sorbitol'),
  ('Mushrooms', 'caution', 'Some varieties are high FODMAP'),
  ('Cauliflower', 'caution', 'Can cause gas in large amounts'),
  ('Honey', 'caution', 'High in fructose, use sparingly'),
  ('Beans', 'caution', 'High in GOS, soak before cooking'),
  ('Garlic', 'avoid', 'High in fructans, common trigger'),
  ('Onion', 'avoid', 'High in fructans, may cause symptoms'),
  ('Wheat', 'avoid', 'Contains fructans, try gluten-free'),
  ('Dairy Ice Cream', 'avoid', 'High lactose content'),
  ('Artificial Sweeteners', 'avoid', 'Sorbitol and mannitol are triggers');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();