-- Create a separate authentication/roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own role
CREATE POLICY "Users can read own role"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- Allow admins to read all roles (no recursion since we're checking the same table)
CREATE POLICY "Admins can read all roles"
ON user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow authenticated users to insert their own role (during registration)
CREATE POLICY "Users can insert own role during registration"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id::text AND role = 'user');

-- Allow admins to insert any role (no recursion)
CREATE POLICY "Admins can insert any role"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to update any role
CREATE POLICY "Admins can update any role"
ON user_roles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  )
);

-- Create an index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Drop all existing policies on users table
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

-- Create new policies on users table that check user_roles instead
CREATE POLICY "Anyone can read users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Users can update their own record
CREATE POLICY "Users can update themselves"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

-- Users can insert their own record (during registration)
CREATE POLICY "Users can insert own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Admins can insert any user (checks user_roles table - NO RECURSION)
CREATE POLICY "Admins can insert users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  )
);

-- Admins can update any user (checks user_roles table - NO RECURSION)
CREATE POLICY "Admins can update users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  )
);

-- Admins can delete users (checks user_roles table - NO RECURSION)
CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE id::text = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  )
);

-- Function to sync user_roles when a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user_role when auth.users is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Migration: Copy existing user roles from users table to user_roles table
INSERT INTO user_roles (id, email, role)
SELECT id, email, COALESCE(role, 'user') as role
FROM users
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();
