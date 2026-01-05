-- Make passwordhash column nullable to allow registration without passwords
-- This simplifies the authentication flow

ALTER TABLE users ALTER COLUMN passwordhash DROP NOT NULL;

-- Add a comment to explain why it's nullable
COMMENT ON COLUMN users.passwordhash IS 'Password hash - nullable to support passwordless authentication';
