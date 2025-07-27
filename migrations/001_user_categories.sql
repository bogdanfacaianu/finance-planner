-- Migration: Create user_categories table
-- Run this in Supabase SQL Editor

-- User Categories table (custom spending categories)
CREATE TABLE IF NOT EXISTS user_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, name, is_active)
);

-- Enable RLS
ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

-- Create policy
DROP POLICY IF EXISTS "User data only" ON user_categories;
CREATE POLICY "User data only" ON user_categories USING (auth.uid() = user_id);