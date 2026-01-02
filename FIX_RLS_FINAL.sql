-- Drop all existing policies
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

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS is_admin();

-- Create a new function that checks admin status without causing recursion
-- This function uses SECURITY DEFINER to bypass RLS when checking role
CREATE OR REPLACE FUNCTION check_user_is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Directly query the role without triggering RLS
  SELECT role INTO user_role
  FROM users
  WHERE id = user_id;
  
  -- Return true if user is admin or super_admin
  RETURN user_role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy 1: Allow all authenticated users to read all user records (for leaderboard, etc.)
CREATE POLICY "allow_read_all_users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow users to update their own record
CREATE POLICY "allow_update_own_record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

-- Policy 3: Allow admins to insert new users
CREATE POLICY "allow_admin_insert"
ON users FOR INSERT
TO authenticated
WITH CHECK (check_user_is_admin(auth.uid()));

-- Policy 4: Allow admins to update any user
CREATE POLICY "allow_admin_update"
ON users FOR UPDATE
TO authenticated
USING (check_user_is_admin(auth.uid()));

-- Policy 5: Allow admins to delete users
CREATE POLICY "allow_admin_delete"
ON users FOR DELETE
TO authenticated
USING (check_user_is_admin(auth.uid()));
