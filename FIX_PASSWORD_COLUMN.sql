-- Fix password column naming in users table
-- The code expects 'password_hash' but the column might be named differently

DO $$ 
BEGIN
  -- Drop the incorrectly named column if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'passwordHash'
  ) THEN
    ALTER TABLE users DROP COLUMN "passwordHash";
    RAISE NOTICE 'Dropped passwordHash column';
  END IF;

  -- Add the correctly named password_hash column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
    RAISE NOTICE 'Added password_hash column';
  ELSE
    RAISE NOTICE 'password_hash column already exists';
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name LIKE '%password%'
ORDER BY column_name;
