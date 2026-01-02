-- Add missing licensePlate and state columns to users table

-- Add licensePlate column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'licenseplate'
    ) THEN
        ALTER TABLE users ADD COLUMN licensePlate TEXT;
        COMMENT ON COLUMN users.licensePlate IS 'User license plate number';
    END IF;
END $$;

-- Add state column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'state'
    ) THEN
        ALTER TABLE users ADD COLUMN state TEXT;
        COMMENT ON COLUMN users.state IS 'User state code (e.g., CA, NY)';
    END IF;
END $$;

-- Add pellet_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'pellet_count'
    ) THEN
        ALTER TABLE users ADD COLUMN pellet_count INTEGER DEFAULT 10;
        COMMENT ON COLUMN users.pellet_count IS 'Number of negative pellets available';
    END IF;
END $$;

-- Add positive_pellet_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'positive_pellet_count'
    ) THEN
        ALTER TABLE users ADD COLUMN positive_pellet_count INTEGER DEFAULT 5;
        COMMENT ON COLUMN users.positive_pellet_count IS 'Number of positive pellets available';
    END IF;
END $$;

-- Add badges column if it doesn't exist (JSON array)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'badges'
    ) THEN
        ALTER TABLE users ADD COLUMN badges JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN users.badges IS 'Array of badge IDs earned by user';
    END IF;
END $$;

-- Update existing users to have default values if they don't have them
UPDATE users 
SET pellet_count = 10 
WHERE pellet_count IS NULL;

UPDATE users 
SET positive_pellet_count = 5 
WHERE positive_pellet_count IS NULL;

UPDATE users 
SET badges = '[]'::jsonb 
WHERE badges IS NULL;

-- Create index on licensePlate for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_licenseplate ON users(licensePlate);

-- Create index on state for faster filtering
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);

-- Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
