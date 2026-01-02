-- SQL to add chwbcc@gmail.com as super admin
-- IMPORTANT: You must sign up with this email first through the app
-- Then run this script to grant super_admin privileges

-- Step 1: Update user_roles table
INSERT INTO user_roles (id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  'super_admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'chwbcc@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'super_admin',
  updated_at = NOW();

-- Step 2: Update users table
INSERT INTO users (
  id, 
  email, 
  username, 
  "passwordHash", 
  created_at, 
  stats, 
  role, 
  "licensePlate", 
  state,
  experience,
  level
)
SELECT 
  au.id::text,
  au.email,
  'Super Admin',
  'managed_by_supabase_auth',
  EXTRACT(EPOCH FROM NOW()) * 1000,
  json_build_object(
    'pelletCount', 1000,
    'positivePelletCount', 1000,
    'badges', '[]'::json,
    'exp', 0,
    'level', 1,
    'name', 'Super Admin',
    'licensePlate', 'ADMIN',
    'state', 'CA'
  )::text,
  'super_admin',
  'ADMIN',
  'CA',
  0,
  1
FROM auth.users au
WHERE au.email = 'chwbcc@gmail.com'
ON CONFLICT (id)
DO UPDATE SET
  role = 'super_admin',
  username = 'Super Admin',
  "licensePlate" = 'ADMIN',
  state = 'CA';

-- Verify the changes
SELECT 
  u.id,
  u.email,
  u.username,
  u.role as users_role,
  ur.role as user_roles_role,
  u."licensePlate",
  u.state
FROM users u
LEFT JOIN user_roles ur ON ur.id::text = u.id
WHERE u.email = 'chwbcc@gmail.com';
