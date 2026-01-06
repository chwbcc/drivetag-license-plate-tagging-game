-- Add columns to track positive and negative ratings received by users
-- These are separate from pellet_count/positive_pellet_count which track pellets the user HAS to give

ALTER TABLE users ADD COLUMN IF NOT EXISTS positive_rating_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS negative_rating_count INTEGER DEFAULT 0;

-- Add constraints (drop first if they exist to avoid errors)
DO $ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positive_rating_count_non_negative') THEN
    ALTER TABLE users ADD CONSTRAINT positive_rating_count_non_negative CHECK (positive_rating_count >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'negative_rating_count_non_negative') THEN
    ALTER TABLE users ADD CONSTRAINT negative_rating_count_non_negative CHECK (negative_rating_count >= 0);
  END IF;
END $;

-- Migrate existing data from pellets table
UPDATE users
SET 
  positive_rating_count = (
    SELECT COUNT(*) 
    FROM pellets 
    WHERE pellets.target_user_id = users.id 
    AND pellets.type = 'positive'
  ),
  negative_rating_count = (
    SELECT COUNT(*) 
    FROM pellets 
    WHERE pellets.target_user_id = users.id 
    AND pellets.type = 'negative'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_positive_rating ON users (positive_rating_count);
CREATE INDEX IF NOT EXISTS idx_users_negative_rating ON users (negative_rating_count);

-- Verify the update
SELECT id, name, license_plate, positive_rating_count, negative_rating_count
FROM users
WHERE license_plate IS NOT NULL
ORDER BY (positive_rating_count + negative_rating_count) DESC
LIMIT 10;
