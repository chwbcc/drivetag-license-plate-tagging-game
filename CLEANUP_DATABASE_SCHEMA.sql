-- CLEANUP DATABASE SCHEMA
-- This script removes redundant columns and ensures proper structure

-- Step 1: Disable RLS temporarily to avoid conflicts
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all RLS policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
DROP POLICY IF EXISTS "Enable read for all users" ON users;
DROP POLICY IF EXISTS "Enable update for own user" ON users;

-- Step 3: Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS pellet_count INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS positive_pellet_count INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badges JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_plate TEXT;

-- Step 4: Migrate data from stats JSON to columns (if needed)
UPDATE users 
SET 
  pellet_count = COALESCE(pellet_count, (stats::json->>'pelletCount')::integer, 10),
  positive_pellet_count = COALESCE(positive_pellet_count, (stats::json->>'positivePelletCount')::integer, 5),
  name = COALESCE(NULLIF(name, ''), stats::json->>'name', username, ''),
  photo = COALESCE(photo, stats::json->>'photo'),
  badges = COALESCE(badges, (stats::json->>'badges')::jsonb, '[]'::jsonb),
  experience = COALESCE(experience, (stats::json->>'exp')::integer, 0),
  level = COALESCE(level, (stats::json->>'level')::integer, 1)
WHERE stats IS NOT NULL AND stats != '';

-- Step 5: Drop redundant and unused columns
ALTER TABLE users DROP COLUMN IF EXISTS passwordhash;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS admin_role;
ALTER TABLE users DROP COLUMN IF EXISTS licenseplate;
ALTER TABLE users DROP COLUMN IF EXISTS resettoken;
ALTER TABLE users DROP COLUMN IF EXISTS resettokenexpiry;
ALTER TABLE users DROP COLUMN IF EXISTS stats;

-- Step 6: Set proper defaults and constraints for all columns
ALTER TABLE users 
  ALTER COLUMN pellet_count SET DEFAULT 10,
  ALTER COLUMN pellet_count SET NOT NULL;

ALTER TABLE users 
  ALTER COLUMN positive_pellet_count SET DEFAULT 5,
  ALTER COLUMN positive_pellet_count SET NOT NULL;

ALTER TABLE users 
  ALTER COLUMN experience SET DEFAULT 0,
  ALTER COLUMN experience SET NOT NULL;

ALTER TABLE users 
  ALTER COLUMN level SET DEFAULT 1,
  ALTER COLUMN level SET NOT NULL;

ALTER TABLE users 
  ALTER COLUMN name SET DEFAULT '',
  ALTER COLUMN name SET NOT NULL;

ALTER TABLE users 
  ALTER COLUMN badges SET DEFAULT '[]'::jsonb,
  ALTER COLUMN badges SET NOT NULL;

ALTER TABLE users 
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN role SET NOT NULL;

-- Step 7: Add constraints for data integrity
ALTER TABLE users ADD CONSTRAINT pellet_count_non_negative CHECK (pellet_count >= 0);
ALTER TABLE users ADD CONSTRAINT positive_pellet_count_non_negative CHECK (positive_pellet_count >= 0);
ALTER TABLE users ADD CONSTRAINT experience_non_negative CHECK (experience >= 0);
ALTER TABLE users ADD CONSTRAINT level_positive CHECK (level >= 1);

-- Step 8: Create simple RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow all users to read all user data (for leaderboard, etc.)
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT
  USING (true);

-- Allow all users to insert (for registration)
CREATE POLICY "Enable insert for registration" ON users
  FOR INSERT
  WITH CHECK (true);

-- Allow all users to update all records (simplified for now)
CREATE POLICY "Enable update for all users" ON users
  FOR UPDATE
  USING (true);

-- Step 9: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_license_plate ON users (license_plate);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_pellet_count ON users (pellet_count);
CREATE INDEX IF NOT EXISTS idx_users_experience ON users (experience);

-- Step 10: Ensure pellets table has proper structure
CREATE INDEX IF NOT EXISTS idx_pellets_target_user ON pellets (targetUserId);
CREATE INDEX IF NOT EXISTS idx_pellets_created_by ON pellets (createdBy);
CREATE INDEX IF NOT EXISTS idx_pellets_type ON pellets (type);
CREATE INDEX IF NOT EXISTS idx_pellets_created_at ON pellets (created_at);

-- Verify the final schema
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
