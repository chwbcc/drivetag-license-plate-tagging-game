-- Add Missing Columns to Users Table
-- Run this in your Supabase SQL Editor

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_plate TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pellet_count INTEGER DEFAULT 10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS positive_pellet_count INTEGER DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo TEXT;

-- Drop the old stats column if it exists (optional - only if you want to clean up)
-- ALTER TABLE users DROP COLUMN IF EXISTS stats;

-- Drop the old passwordHash column if it exists (we're using password_hash now)
-- ALTER TABLE users DROP COLUMN IF EXISTS passwordHash;

-- Drop the old username column if it exists (we're using name now)
-- ALTER TABLE users DROP COLUMN IF EXISTS username;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_experience ON users(experience DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
