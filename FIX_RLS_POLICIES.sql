-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Users can insert if they are admin" ON users;
DROP POLICY IF EXISTS "Allow admins to manage users" ON users;
DROP POLICY IF EXISTS "Allow users to read all users" ON users;
DROP POLICY IF EXISTS "Allow users to update themselves" ON users;

-- Create a function to check if user is admin (uses security definer to bypass RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
RETURN EXISTS (
  SELECT 1 FROM users
  WHERE id = auth.uid()
  AND role IN ('admin', 'super_admin')
);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anyone to read users (for leaderboard, etc.)
CREATE POLICY "Allow read access for authenticated users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own record
CREATE POLICY "Users can update own record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow admins to insert new users (using the security definer function)
CREATE POLICY "Admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Allow admins to update any user (using the security definer function)
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
TO authenticated
USING (is_admin());

-- Allow admins to delete users (using the security definer function)
CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (is_admin());
