-- Drop existing user_roles table if it exists
DROP TABLE IF EXISTS user_roles CASCADE;

-- Create user_roles table with TEXT id to match users table
CREATE TABLE user_roles (
  id TEXT PRIMARY KEY,
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
USING (auth.uid()::text = id);

-- Allow admins to read all roles (checks same table, no recursion)
CREATE POLICY "Admins can read all roles"
ON user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.id = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Allow authenticated users to insert their own role during registration (as 'user' only)
CREATE POLICY "Users can insert own role during registration"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id AND role = 'user');

-- Allow admins to insert any role
CREATE POLICY "Admins can insert any role"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.id = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to update any role
CREATE POLICY "Admins can update any role"
ON user_roles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.id = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Allow admins to delete roles
CREATE POLICY "Admins can delete roles"
ON user_roles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.id = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Create indexes for faster lookups
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
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create new policies on users table that check user_roles
CREATE POLICY "Anyone can read users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own record (during registration)
CREATE POLICY "Users can insert own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- Users can update their own record
CREATE POLICY "Users can update own record"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id);

-- Admins can insert any user (checks user_roles table - NO RECURSION)
CREATE POLICY "Admins can insert any user"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.id = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Admins can update any user (checks user_roles table - NO RECURSION)
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.id = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Admins can delete users (checks user_roles table - NO RECURSION)
CREATE POLICY "Admins can delete any user"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.id = auth.uid()::text
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Migrate existing users to user_roles table
INSERT INTO user_roles (id, email, role, created_at, updated_at)
SELECT id, email, COALESCE(role, 'user') as role, NOW(), NOW()
FROM users
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  updated_at = NOW();
