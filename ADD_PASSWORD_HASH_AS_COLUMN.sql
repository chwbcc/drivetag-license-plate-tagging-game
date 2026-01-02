-- Add passwordHash as a direct column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Migrate existing data from stats JSON to password_hash column
UPDATE users 
SET password_hash = (stats::json->>'passwordHash')
WHERE password_hash IS NULL 
  AND stats IS NOT NULL 
  AND stats::json->>'passwordHash' IS NOT NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
