-- Schema Verification and Fix Script
-- Run this in your Supabase SQL Editor

-- Step 1: Check current schema
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'pellets', 'badges', 'activities')
ORDER BY table_name, ordinal_position;

-- Step 2: Drop and recreate tables with correct schema
-- WARNING: This will delete all data. Only run if you want a fresh start.

DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS pellets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  stats TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  licensePlate TEXT,
  state TEXT,
  resetToken TEXT,
  resetTokenExpiry BIGINT
);

-- Create indexes
CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_license_plate ON users(LOWER(licensePlate));

-- Create pellets table
CREATE TABLE pellets (
  id TEXT PRIMARY KEY,
  targetLicensePlate TEXT NOT NULL,
  targetUserId TEXT,
  createdBy TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('negative', 'positive')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

-- Create indexes for pellets
CREATE INDEX idx_pellets_target_plate ON pellets(LOWER(targetLicensePlate));
CREATE INDEX idx_pellets_created_by ON pellets(createdBy);
CREATE INDEX idx_pellets_created_at ON pellets(created_at DESC);

-- Create badges table
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  badgeId TEXT NOT NULL,
  earned_at BIGINT NOT NULL,
  UNIQUE(userId, badgeId)
);

-- Create index for badges
CREATE INDEX idx_badges_user_id ON badges(userId);

-- Create activities table
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  actionType TEXT NOT NULL,
  actionData TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Create indexes for activities
CREATE INDEX idx_activities_user_id ON activities(userId);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
