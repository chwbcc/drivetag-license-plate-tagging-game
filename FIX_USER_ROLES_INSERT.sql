-- Drop and recreate user_roles policies to fix insertion issues

-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Users can read own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role during registration" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert any role" ON user_roles;
DROP POLICY IF EXISTS "Admins can update any role" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON user_roles;

-- Allow users to read their own role
CREATE POLICY "Users can read own role"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

-- Allow admins to read all roles
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

-- Allow service role to insert (for backend operations)
CREATE POLICY "Service role can insert"
ON user_roles FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow authenticated users to insert their own role as 'user' during registration
CREATE POLICY "Users can insert own role during registration"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = id 
  AND role = 'user'
);

-- Allow admins to insert any role using SECURITY DEFINER function
CREATE OR REPLACE FUNCTION can_insert_user_role(target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user is an admin
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE id = auth.uid()::text
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can insert any role"
ON user_roles FOR INSERT
TO authenticated
WITH CHECK (can_insert_user_role(role));

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
