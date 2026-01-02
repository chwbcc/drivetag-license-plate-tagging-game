-- Fix RLS policies to allow registration without authentication

-- Drop existing policies on user_roles
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role during registration" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert any role" ON user_roles;
DROP POLICY IF EXISTS "Admins can update any role" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Drop the security definer function if it exists
DROP FUNCTION IF EXISTS is_user_admin();

-- Allow anyone to read user_roles (needed for admin checks)
CREATE POLICY "Allow read access to user_roles"
ON user_roles FOR SELECT
USING (true);

-- Allow unauthenticated inserts with role='user' only (for registration)
-- This allows new users to register themselves
CREATE POLICY "Allow registration inserts"
ON user_roles FOR INSERT
WITH CHECK (
  role = 'user'
);

-- Allow authenticated users to update their own role to 'user' only
CREATE POLICY "Users can update own role to user"
ON user_roles FOR UPDATE
TO authenticated
USING (id::text = auth.uid()::text)
WITH CHECK (
  id::text = auth.uid()::text 
  AND role = 'user'
);

-- Create SECURITY DEFINER function to safely check admin status
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role from user_roles table
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

-- Allow admins to insert any role
CREATE POLICY "Admins can insert any role"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (is_user_admin());

-- Allow admins to update any role
CREATE POLICY "Admins can update any role"
ON user_roles FOR UPDATE
TO authenticated
USING (is_user_admin());

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (is_user_admin());

-- Update users table policies
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Allow anyone to read users (needed for leaderboard, etc.)
CREATE POLICY "Allow read access to users"
ON users FOR SELECT
USING (true);

-- Allow unauthenticated inserts (for registration)
CREATE POLICY "Allow registration inserts on users"
ON users FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to update their own record
CREATE POLICY "Users can update themselves"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

-- Allow admins to insert any user
CREATE POLICY "Admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (is_user_admin());

-- Allow admins to update any user
CREATE POLICY "Admins can update users"
ON users FOR UPDATE
TO authenticated
USING (is_user_admin());

-- Allow admins to delete users
CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (is_user_admin());
