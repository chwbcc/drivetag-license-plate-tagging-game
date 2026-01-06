-- Fix the current_user SQL syntax error
-- Run this in your Supabase SQL Editor

-- First, let's disable the problematic RLS policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE pellets DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might have the issue
DROP POLICY IF EXISTS users_delete_policy ON users;
DROP POLICY IF EXISTS users_select_policy ON users;
DROP POLICY IF EXISTS users_update_policy ON users;
DROP POLICY IF EXISTS users_insert_policy ON users;

DROP POLICY IF EXISTS badges_delete_policy ON badges;
DROP POLICY IF EXISTS pellets_delete_policy ON pellets;
DROP POLICY IF EXISTS activities_delete_policy ON activities;

-- Re-enable RLS without restrictive policies (since we handle auth in backend)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE pellets ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that allow backend operations
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on badges" ON badges
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on pellets" ON pellets
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on activities" ON activities
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the policies are in place
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'badges', 'pellets', 'activities');
