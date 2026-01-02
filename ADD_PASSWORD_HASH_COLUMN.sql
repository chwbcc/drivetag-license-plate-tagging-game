-- Add passwordHash column to users table if it doesn't exist
DO $$ 
BEGIN
  -- Check if passwordHash column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'passwordhash'
  ) THEN
    -- Add the passwordHash column
    ALTER TABLE users ADD COLUMN "passwordHash" TEXT;
    RAISE NOTICE 'Added passwordHash column to users table';
  ELSE
    RAISE NOTICE 'passwordHash column already exists';
  END IF;
END $$;

-- Notify to reload schema
NOTIFY pgrst, 'reload schema';
