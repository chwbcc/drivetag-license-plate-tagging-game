-- Database Migration Script
-- Run this in your Supabase SQL Editor to fix schema issues

-- Step 1: Drop existing tables (WARNING: This deletes all data!)
-- If you need to preserve data, backup first
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS pellets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create users table with correct schema
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  name TEXT,
  photo TEXT,
  license_plate TEXT,
  state TEXT,
  created_at BIGINT,
  role TEXT DEFAULT 'user',
  experience INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  negative_pellet_count INTEGER DEFAULT 10,
  positive_pellet_count INTEGER DEFAULT 5,
  positive_rating_count INTEGER DEFAULT 0,
  negative_rating_count INTEGER DEFAULT 0,
  pellets_given_count INTEGER DEFAULT 0,
  positive_pellets_given_count INTEGER DEFAULT 0,
  negative_pellets_given_count INTEGER DEFAULT 0,
  badges TEXT DEFAULT '[]'
);

-- Step 3: Create pellets table with correct schema and foreign key
CREATE TABLE pellets (
  id TEXT PRIMARY KEY,
  license_plate TEXT NOT NULL,
  targetuserid TEXT,
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  notes TEXT,
  type TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  CONSTRAINT fk_pellets_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_pellets_target_user FOREIGN KEY (targetuserid) REFERENCES users(id) ON DELETE SET NULL
);

-- Step 4: Create badges table with foreign key
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  userid TEXT NOT NULL,
  badgeid TEXT NOT NULL,
  earned_at BIGINT NOT NULL,
  CONSTRAINT fk_badges_userid FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 5: Create activities table with foreign key
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  userid TEXT NOT NULL,
  actiontype TEXT NOT NULL,
  actiondata TEXT,
  created_at BIGINT NOT NULL,
  CONSTRAINT fk_activities_userid FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 6: Add indexes for better performance and data integrity
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_license_plate ON users(license_plate);
CREATE INDEX IF NOT EXISTS idx_pellets_license_plate ON pellets(license_plate);
CREATE INDEX IF NOT EXISTS idx_pellets_created_by ON pellets(created_by);
CREATE INDEX IF NOT EXISTS idx_pellets_targetuserid ON pellets(targetuserid);
CREATE INDEX IF NOT EXISTS idx_pellets_created_at ON pellets(created_at);
CREATE INDEX IF NOT EXISTS idx_badges_userid ON badges(userid);
CREATE INDEX IF NOT EXISTS idx_activities_userid ON activities(userid);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE pellets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
DROP POLICY IF EXISTS "Allow public read access to pellets" ON pellets;
DROP POLICY IF EXISTS "Allow authenticated insert to pellets" ON pellets;
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own data" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert to badges" ON badges;
DROP POLICY IF EXISTS "Allow public read access to badges" ON badges;
DROP POLICY IF EXISTS "Allow public read access to activities" ON activities;
DROP POLICY IF EXISTS "Allow authenticated insert to activities" ON activities;

-- Pellets policies
CREATE POLICY "Allow public read access to pellets"
  ON pellets FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to pellets"
  ON pellets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete to pellets"
  ON pellets FOR DELETE
  USING (true);

-- Users policies
CREATE POLICY "Allow public read access to users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update their own data"
  ON users FOR UPDATE
  USING (true);

CREATE POLICY "Allow users to insert their own data"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow users to delete their own data"
  ON users FOR DELETE
  USING (true);

-- Badges policies
CREATE POLICY "Allow public read access to badges"
  ON badges FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to badges"
  ON badges FOR INSERT
  WITH CHECK (true);

-- Activities policies
CREATE POLICY "Allow public read access to activities"
  ON activities FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert to activities"
  ON activities FOR INSERT
  WITH CHECK (true);
