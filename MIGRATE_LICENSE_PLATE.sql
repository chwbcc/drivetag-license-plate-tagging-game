-- Migrate data from old licenseplate column to license_plate column
-- This ensures all license plate data is in the correct column

-- Copy any data from licenseplate to license_plate where license_plate is null
UPDATE users
SET license_plate = licenseplate
WHERE license_plate IS NULL AND licenseplate IS NOT NULL;

-- Drop the old licenseplate column (without underscore)
ALTER TABLE users DROP COLUMN IF EXISTS licenseplate;

-- Verify the migration
SELECT id, email, license_plate, state 
FROM users 
WHERE license_plate IS NOT NULL;
