-- Add columns to track positive and negative ratings received by users
-- These are separate from pellet_count/positive_pellet_count which track pellets the user HAS to give

ALTER TABLE users ADD COLUMN IF NOT EXISTS positive_rating_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS negative_rating_count INTEGER DEFAULT 0;

-- Add columns to track pellets given by users
ALTER TABLE users ADD COLUMN IF NOT EXISTS pellets_given_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_positive_rating ON users (positive_rating_count);
CREATE INDEX IF NOT EXISTS idx_users_negative_rating ON users (negative_rating_count);
CREATE INDEX IF NOT EXISTS idx_users_pellets_given ON users (pellets_given_count);

-- Migrate existing data from pellets table for ratings received
UPDATE users
SET 
  positive_rating_count = (
    SELECT COUNT(*) 
    FROM pellets 
    WHERE pellets.targetuserid = users.id 
    AND pellets.type = 'positive'
  ),
  negative_rating_count = (
    SELECT COUNT(*) 
    FROM pellets 
    WHERE pellets.targetuserid = users.id 
    AND pellets.type = 'negative'
  ),
  pellets_given_count = (
    SELECT COUNT(*) 
    FROM pellets 
    WHERE pellets.created_by = users.id
  );

-- Verify the update
SELECT id, name, license_plate, positive_rating_count, negative_rating_count, pellets_given_count
FROM users
WHERE license_plate IS NOT NULL
ORDER BY (positive_rating_count + negative_rating_count) DESC
LIMIT 10;
