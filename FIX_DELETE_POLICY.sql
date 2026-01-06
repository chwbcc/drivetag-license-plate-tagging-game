-- Fix DELETE policy for users table
-- This allows super_admins to delete users

-- Drop existing delete policies
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;
DROP POLICY IF EXISTS "allow_admin_delete" ON users;
DROP POLICY IF EXISTS "Admins can delete any user" ON users;

-- Create a simple DELETE policy that checks the role directly
-- This assumes the current user's ID is accessible and we can check their role
CREATE POLICY "super_admin_can_delete_users"
ON users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM users AS current_user
    WHERE current_user.id = current_setting('app.current_user_id', true)
    AND current_user.role = 'super_admin'
  )
);

-- If the above doesn't work due to current_setting not being set,
-- you can also temporarily disable RLS for testing (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
