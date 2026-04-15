-- Run this in: Supabase Dashboard → SQL Editor → New query

CREATE TABLE IF NOT EXISTS public.users_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  mastered_ids INTEGER[] DEFAULT '{}',
  review_ids  INTEGER[] DEFAULT '{}',
  session_score INTEGER DEFAULT 0,
  lives       INTEGER DEFAULT 5,
  total_seen  INTEGER DEFAULT 0,
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (users can only see their own data)
ALTER TABLE public.users_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress"
  ON public.users_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.users_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.users_progress FOR UPDATE
  USING (auth.uid() = user_id);
