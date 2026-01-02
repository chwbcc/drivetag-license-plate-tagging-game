# Supabase Database Setup

Your Supabase database is now connected to the app! 🎉

## Environment Variables

The following environment variables are already configured:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EXPO_PUBLIC_SUPABASE_URL`: Public URL for client-side access
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Public key for client-side access

## Database Tables Setup

You need to create the following tables in your Supabase dashboard. Follow these steps:

1. Go to your Supabase dashboard: https://vhqpsnezcvqgikpqzdgk.supabase.co
2. Navigate to the SQL Editor
3. **IMPORTANT**: If you already created tables, drop them first or run the ALTER statements below
4. Run the SQL script below to create all required tables

### SQL Script

```sql
-- Drop existing tables if they exist (OPTIONAL - only if recreating)
-- DROP TABLE IF EXISTS activities CASCADE;
-- DROP TABLE IF EXISTS badges CASCADE;
-- DROP TABLE IF EXISTS pellets CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  passwordHash TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  stats TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  licensePlate TEXT,
  state TEXT,
  resetToken TEXT,
  resetTokenExpiry BIGINT
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));

-- Create index on licensePlate for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_license_plate ON users(LOWER(licensePlate));

-- Create pellets table
CREATE TABLE IF NOT EXISTS pellets (
  id TEXT PRIMARY KEY,
  targetLicensePlate TEXT NOT NULL,
  targetUserId TEXT,
  createdBy TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('negative', 'positive')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
);

-- Create indexes for pellets table
CREATE INDEX IF NOT EXISTS idx_pellets_target_plate ON pellets(LOWER(targetLicensePlate));
CREATE INDEX IF NOT EXISTS idx_pellets_created_by ON pellets(createdBy);
CREATE INDEX IF NOT EXISTS idx_pellets_created_at ON pellets(created_at DESC);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  badgeId TEXT NOT NULL,
  earned_at BIGINT NOT NULL,
  UNIQUE(userId, badgeId)
);

-- Create index for badges table
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(userId);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  actionType TEXT NOT NULL,
  actionData TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Create index for activities table
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(userId);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
```

## Troubleshooting

### Schema Cache Error

If you see errors like "Could not find the 'created_at' column in the schema cache":

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Click "Reload schema cache" button
4. Wait a few seconds and try again

OR if tables exist with wrong column names:

```sql
-- Check your current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- If column is named 'createdAt' instead of 'created_at', rename it:
ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE pellets RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE badges RENAME COLUMN "earnedAt" TO earned_at;
ALTER TABLE activities RENAME COLUMN "createdAt" TO created_at;
```

### Backend Connection Error

If you see "Failed to fetch" errors:

1. Check that your backend is running (the backend should auto-start)
2. Check the Console tab for backend initialization logs
3. Try the "Test Connection" button in the Admin panel

## Testing the Connection

After creating the tables, the app will automatically connect to your Supabase database. You can test it by:

1. Registering a new user
2. Creating pellets
3. Checking the admin panel

## Next Steps

Your database is now fully configured! The app will:
- Store all user data in Supabase
- Track pellets and badges
- Log user activities
- Handle authentication and password resets

All database operations are now using Supabase's client library with proper error handling and type safety.
