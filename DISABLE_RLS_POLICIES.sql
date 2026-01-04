-- Disable complex RLS policies to fix infinite recursion
-- This is a back-to-basics approach for user creation

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
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_insert_registration" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_update_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

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
DROP POLICY IF EXISTS "user_roles_select_all" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_registration" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_admin" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON user_roles;

-- Drop admin check functions that cause recursion
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_user_admin() CASCADE;
DROP FUNCTION IF EXISTS check_is_admin() CASCADE;

-- Disable RLS on both tables (back to basics)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
