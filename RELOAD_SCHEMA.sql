-- Run this in Supabase SQL Editor to fix schema cache errors
-- This notifies PostgREST to reload its schema cache

NOTIFY pgrst, 'reload schema';

-- Verify the actual schema
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- If the schema is correct, the cache reload above should fix it
-- If not, run SCHEMA_FIX.sql first, then run this command again
