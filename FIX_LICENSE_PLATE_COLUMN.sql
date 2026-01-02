-- Add missing columns to users table (simpler version without DO blocks)

-- Add licensePlate column (PostgREST will map licensePlate to license_plate)
ALTER TABLE users ADD COLUMN IF NOT EXISTS licensePlate TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_plate TEXT;

-- Add state column
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_license_plate ON users(license_plate);
CREATE INDEX IF NOT EXISTS idx_users_licensePlate ON users(licensePlate);
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);

-- Update schema cache comment to force refresh
COMMENT ON TABLE users IS 'User accounts - updated with license plate fields';
