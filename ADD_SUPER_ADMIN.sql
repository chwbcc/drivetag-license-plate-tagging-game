-- SQL to add chwbcc@gmail.com as super admin
-- This script handles the case where the user may or may not already exist

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'chwbcc@gmail.com';
  v_username TEXT := 'Super Admin';
  v_license_plate TEXT := 'ADMIN';
  v_state TEXT := 'CA';
BEGIN
  -- Step 1: Check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  -- If user doesn't exist in auth.users, create it
  -- Note: You'll need to sign up manually first through the app or Supabase Auth UI
  -- because password hashing in SQL is complex. This script will handle the rest.
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found in auth.users. Please sign up with email % first, then run this script again.', v_email;
    RAISE EXCEPTION 'User must exist in auth.users first';
  ELSE
    RAISE NOTICE 'Found user in auth.users with ID: %', v_user_id;
  END IF;

  -- Step 2: Insert or update user_roles (handles duplicate key error)
  INSERT INTO user_roles (id, email, role, created_at, updated_at)
  VALUES (v_user_id, v_email, 'super_admin', NOW(), NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'super_admin',
    updated_at = NOW();
  
  RAISE NOTICE 'Updated user_roles for %', v_email;

  -- Step 3: Insert or update users table
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
  VALUES (
    v_user_id::text,
    v_email,
    v_username,
    'managed_by_supabase_auth',
    EXTRACT(EPOCH FROM NOW()) * 1000,
    json_build_object(
      'pelletCount', 1000,
      'positivePelletCount', 1000,
      'badges', '[]'::json,
      'exp', 0,
      'level', 1,
      'name', v_username,
      'licensePlate', v_license_plate,
      'state', v_state
    )::text,
    'super_admin',
    v_license_plate,
    v_state,
    0,
    1
  )
  ON CONFLICT (id)
  DO UPDATE SET
    role = 'super_admin',
    username = v_username,
    "licensePlate" = v_license_plate,
    state = v_state,
    stats = json_build_object(
      'pelletCount', 1000,
      'positivePelletCount', 1000,
      'badges', COALESCE((users.stats::json->>'badges')::json, '[]'::json),
      'exp', COALESCE((users.stats::json->>'exp')::int, 0),
      'level', COALESCE((users.stats::json->>'level')::int, 1),
      'name', v_username,
      'licensePlate', v_license_plate,
      'state', v_state
    )::text;

  RAISE NOTICE 'Updated users table for %', v_email;
  RAISE NOTICE 'Successfully set % as super_admin!', v_email;

END $$;

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
