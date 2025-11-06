-- Migration: fix_user_profiles_insert_policy
-- Created at: 1762313910


-- Add INSERT policy for user_profiles to allow registration
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also add policy to allow anyone to create profiles (needed for registration)
DROP POLICY IF EXISTS "Allow profile creation on signup" ON user_profiles;
CREATE POLICY "Allow profile creation on signup"
  ON user_profiles FOR INSERT
  WITH CHECK (true);
;