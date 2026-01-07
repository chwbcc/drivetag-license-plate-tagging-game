-- Add columns to track positive and negative pellets given separately

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS negative_pellets_given_count INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS positive_pellets_given_count INTEGER DEFAULT 0 NOT NULL;

-- Add constraints to ensure counts are non-negative
ALTER TABLE users 
ADD CONSTRAINT negative_pellets_given_count_non_negative 
CHECK (negative_pellets_given_count >= 0);

ALTER TABLE users 
ADD CONSTRAINT positive_pellets_given_count_non_negative 
CHECK (positive_pellets_given_count >= 0);

-- Populate the new columns based on existing pellets data
UPDATE users 
SET negative_pellets_given_count = (
    SELECT COUNT(*) 
    FROM pellets 
    WHERE pellets.createdby = users.id 
    AND pellets.type = 'negative'
);

UPDATE users 
SET positive_pellets_given_count = (
    SELECT COUNT(*) 
    FROM pellets 
    WHERE pellets.createdby = users.id 
    AND pellets.type = 'positive'
);
