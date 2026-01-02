-- Fix infinite recursion in RLS policies
-- The issue: is_admin() queries users table, which triggers RLS policies that call is_admin() again

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Users can insert if they are admin" ON users;
DROP POLICY IF EXISTS "Allow admins to manage users" ON users;
DROP POLICY IF EXISTS "Allow users to read all users" ON users;
DROP POLICY IF EXISTS "Allow users to update themselves" ON users;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Allow read access to users" ON users;
DROP POLICY IF EXISTS "Allow registration inserts on users" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Drop ALL existing policies on user_roles table
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role during registration" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert any role" ON user_roles;
DROP POLICY IF EXISTS "Admins can update any role" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Allow read access to user_roles" ON user_roles;
DROP POLICY IF EXISTS "Allow registration inserts" ON user_roles;
DROP POLICY IF EXISTS "Users can update own role to user" ON user_roles;

-- Drop old functions (CASCADE to drop dependent policies)
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_user_admin() CASCADE;

-- Create a SECURITY DEFINER function that checks admin status using user_roles table
-- This avoids recursion because it doesn't query the users table
CREATE OR REPLACE FUNCTION check_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get role from user_roles table (NOT users table - this avoids recursion)
  SELECT role INTO user_role
  FROM user_roles
  WHERE id::text = auth.uid()::text;
  
  -- Return true if user is admin or super_admin
  RETURN user_role IN ('admin', 'super_admin');
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USER_ROLES TABLE POLICIES
-- ============================================

-- Allow everyone to read user_roles (needed for admin checks)
CREATE POLICY "user_roles_select_all"
ON user_roles FOR SELECT
USING (true);

-- Allow anyone to insert with role='user' (for registration)
CREATE POLICY "user_roles_insert_registration"
ON user_roles FOR INSERT
WITH CHECK (role = 'user');

-- Allow admins to insert any role
CREATE POLICY "user_roles_insert_admin"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (check_is_admin());

-- Allow admins to update any role
CREATE POLICY "user_roles_update_admin"
ON user_roles FOR UPDATE
TO authenticated
USING (check_is_admin());

-- Allow admins to delete roles
CREATE POLICY "user_roles_delete_admin"
ON user_roles FOR DELETE
TO authenticated
USING (check_is_admin());

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Allow everyone to read users (for leaderboard, profile viewing, etc.)
CREATE POLICY "users_select_all"
ON users FOR SELECT
USING (true);

-- Allow anyone to insert (for registration)
CREATE POLICY "users_insert_registration"
ON users FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to update their own record
CREATE POLICY "users_update_self"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

-- Allow admins to update any user
CREATE POLICY "users_update_admin"
ON users FOR UPDATE
TO authenticated
USING (check_is_admin());

-- Allow admins to delete users
CREATE POLICY "users_delete_admin"
ON users FOR DELETE
TO authenticated
USING (check_is_admin());

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
