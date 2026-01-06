-- Database Schema Cleanup
-- This migration removes redundant columns from the users table

-- Drop redundant columns
ALTER TABLE users DROP COLUMN IF EXISTS passwordhash;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS licenseplate;
ALTER TABLE users DROP COLUMN IF EXISTS resettoken;
ALTER TABLE users DROP COLUMN IF EXISTS resettokenexpiry;
ALTER TABLE users DROP COLUMN IF EXISTS pellet_count;
ALTER TABLE users DROP COLUMN IF EXISTS positive_pellet_count;
ALTER TABLE users DROP COLUMN IF EXISTS admin_role;
ALTER TABLE users DROP COLUMN IF EXISTS badges;

-- Final schema will be:
-- id text (primary key)
-- email text (unique, not null)
-- username text (not null)
-- created_at bigint (not null)
-- stats text (not null) - JSON containing: pelletCount, positivePelletCount, badges, name, photo
-- role text (not null, default 'user')
-- license_plate text (nullable)
-- state text (nullable)
-- experience integer (nullable, default 0)
-- level integer (nullable, default 1)
-- name text (not null, default '')
-- photo text (nullable)
