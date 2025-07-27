-- Migration: Add advanced budget properties
-- Run this in Supabase SQL Editor

-- Add new columns to budgets table
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'flexible' CHECK(category_type IN ('fixed', 'flexible')),
ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'recurring' CHECK(recurrence_type IN ('recurring', 'one-off')),
ADD COLUMN IF NOT EXISTS workdays_per_month INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category_group TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_calculate BOOLEAN DEFAULT false;