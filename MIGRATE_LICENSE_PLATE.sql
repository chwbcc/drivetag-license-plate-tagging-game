-- Migrate data from old licenseplate column to license_plate column
-- This ensures all license plate data is in the correct column

-- Check if the old column exists and migrate if it does
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'licenseplate'
    ) THEN
        -- Copy any data from licenseplate to license_plate where license_plate is null
        UPDATE users
        SET license_plate = licenseplate
        WHERE license_plate IS NULL AND licenseplate IS NOT NULL;
        
        -- Drop the old licenseplate column (without underscore)
        ALTER TABLE users DROP COLUMN licenseplate;
        
        RAISE NOTICE 'Migration completed: licenseplate column migrated and dropped';
    ELSE
        RAISE NOTICE 'Migration skipped: licenseplate column does not exist';
    END IF;
END $$;

-- Verify the migration
SELECT id, email, license_plate, state 
FROM users 
WHERE license_plate IS NOT NULL;
