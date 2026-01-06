-- Migration: Rename pellet_count to negative_pellet_count
-- Purpose: Make it easier to distinguish between negative and positive pellets

-- Rename the column
ALTER TABLE users 
RENAME COLUMN pellet_count TO negative_pellet_count;

-- Update any constraints (if they exist)
-- Drop old constraint if exists
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS pellet_count_non_negative;

-- Add new constraint with updated name
ALTER TABLE users 
ADD CONSTRAINT negative_pellet_count_non_negative CHECK (negative_pellet_count >= 0);

-- Update any indexes (if they exist)
-- Drop old index if exists
DROP INDEX IF EXISTS idx_users_pellet_count;

-- Create new index with updated name
CREATE INDEX IF NOT EXISTS idx_users_negative_pellet_count ON users (negative_pellet_count);

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('negative_pellet_count', 'positive_pellet_count')
ORDER BY column_name;
