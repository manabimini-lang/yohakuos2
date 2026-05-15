-- YOHAKU OS Database Schema

-- 1. Profiles (Linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'staff', 'member')),
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Plans (Membership Tiers)
CREATE TABLE plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_id TEXT, -- Stripe Price ID
  price_monthly INTEGER DEFAULT 0,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Monthly Themes
CREATE TABLE themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month_date DATE NOT NULL, -- First day of the month
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Contents
CREATE TABLE contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  external_url TEXT,
  category TEXT, -- e.g., 'Video', 'Article', 'Resource'
  layer TEXT DEFAULT 'public' CHECK (layer IN ('public', 'member', 'exclusive')),
  monthly_theme_id UUID REFERENCES themes(id),
  is_published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Event Logs (KPI tracking)
CREATE TABLE event_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI Recommendation Logs
CREATE TABLE recommendation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  content_id UUID REFERENCES contents(id),
  score FLOAT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Consultations (AI Agent History)
CREATE TABLE consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  query TEXT NOT NULL,
  answer TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Example for contents)
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all content"
ON contents FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Public/Members can view published content based on layer
CREATE POLICY "Anyone can view published public content"
ON contents FOR SELECT
USING (is_published = true AND layer = 'public');

CREATE POLICY "Members can view published member content"
ON contents FOR SELECT
USING (
  is_published = true 
  AND layer = 'member' 
  AND auth.uid() IS NOT NULL
);

-- INDEXES
CREATE INDEX idx_contents_published ON contents(is_published);
CREATE INDEX idx_contents_layer ON contents(layer);
CREATE INDEX idx_event_logs_type ON event_logs(event_type);
CREATE INDEX idx_themes_date ON themes(month_date);
