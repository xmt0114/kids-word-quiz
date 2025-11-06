-- Migration: fix_user_settings_anonymous_access
-- Fix RLS policies for user_settings table to allow anonymous user access

-- Add anonymous user access policy for user_settings table
DROP POLICY IF EXISTS "Anonymous can manage settings" ON user_settings;
CREATE POLICY "Anonymous can manage settings"
  ON user_settings FOR ALL
  USING (true);

-- Also ensure user_profiles has anonymous access if needed
DROP POLICY IF EXISTS "Anonymous can manage profiles" ON user_profiles;
CREATE POLICY "Anonymous can manage profiles"
  ON user_profiles FOR ALL
  USING (true);
