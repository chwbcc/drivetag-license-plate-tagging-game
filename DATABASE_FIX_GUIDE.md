# Database Error Fix Guide

## Errors Being Fixed

1. **SQLITE_UNKNOWN: SQLite error: table pellets has no column named targetUserId**
2. **Failed to update pellet count: User not found**
3. **Failed to update experience: User not found**
4. **Failed to add badge**

## Root Causes

### 1. Missing Database Column
The `targetUserId` column was added to the schema but the existing database wasn't migrated. This happens when the database was created before the schema update.

### 2. User Not Synced to Database
Users are stored in local AsyncStorage (via Zustand) but may not be synced to the backend database. When the app tries to update user data (pellet count, experience, badges), it can't find the user in the database.

## Fixes Applied

### 1. Database Migration
Created `backend/migrate-database.ts` that:
- Checks if the `targetUserId` column exists in the `pellets` table
- Adds it if missing
- Now runs automatically on database initialization

### 2. Updated Database Initialization
Modified `backend/database.ts` to automatically run migrations during initialization, ensuring the schema is always up-to-date.

### 3. Improved Pellet Service
Updated `backend/services/pellet-service.ts` to:
- Automatically look up the target user by license plate
- Handle cases where the target user doesn't exist in the database
- Set `targetUserId` to null if no user is found (which is fine - not all license plates belong to registered users)

### 4. Enhanced Error Logging
Added detailed logging in:
- `backend/services/user-service.ts` - Shows exact user ID being looked up
- `backend/services/pellet-service.ts` - Shows when users are found/not found
- All routes - Better error context

## How to Run the Migration

### Option 1: Automatic (Recommended)
The migration runs automatically when the database initializes. Just restart your app and the migrations will run on the next database connection.

### Option 2: Manual
Run the migration script directly:

```bash
bun run backend/migrate-database.ts
```

## How to Fix "User not found" Errors

The "User not found" errors occur when a user exists in local storage but not in the database. This typically happens during development or when the database is reset.

### Solution: Re-register or Sync Your User

1. **Option A: Logout and Login Again**
   - The login process will sync your user to the database
   - Navigate to Profile → Logout
   - Login again with your credentials

2. **Option B: Check if User Exists in Database**
   Run this script to see all users in your database:
   ```bash
   bun run backend/pull-database-info.ts
   ```

3. **Option C: Use the Sync User Route**
   The app should automatically sync users, but you can verify by checking the login flow in `app/(auth)/index.tsx`

## Verifying the Fixes

### 1. Check Database Schema
```bash
bun run backend/pull-database-info.ts
```

This will show you:
- All tables in your database
- All columns in each table
- Sample data

Look for the `targetUserId` column in the `pellets` table.

### 2. Test Creating a Pellet
1. Login to your app
2. Navigate to Tag Driver screen
3. Fill out the form and submit
4. Check the console logs - you should see:
   - `[PelletService] Creating pellet with data:`
   - `[PelletService] Found target user:` OR `[PelletService] No user found with license plate:`
   - `[PelletService] Created pellet successfully:`

### 3. Test User Updates
After tagging a driver, check the console for:
- `[User] Updating pellet count:`
- `[UserService] User found:` (should show the email)
- `[UserService] Updated user pellet counts successfully:`

## Common Issues & Solutions

### Issue: Still getting "User not found"
**Cause**: Your user ID in AsyncStorage doesn't match any user in the database.

**Solution**:
1. Clear app storage:
   - iOS: Delete app and reinstall
   - Android: Clear app data in settings
   - Web: Clear localStorage in browser dev tools
2. Register a new account
3. The registration process will create the user in the database

### Issue: "table pellets has no column named targetUserId" persists
**Cause**: Migration didn't run or failed.

**Solution**:
1. Run the migration manually: `bun run backend/migrate-database.ts`
2. Check your database connection:
   - Verify `.env` has `TURSO_DB_URL` and `TURSO_AUTH_TOKEN`
   - Run `bun run backend/check-database-connection.ts`

### Issue: Pellets save but counts don't update
**Cause**: User exists but updates are failing.

**Solution**:
1. Check the console logs for detailed error messages
2. Verify your user ID matches between frontend and backend:
   - Frontend: Check AsyncStorage → `auth-storage` → `state` → `user` → `id`
   - Backend: Run `bun run backend/pull-database-info.ts` and find your user

## Database Schema Reference

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  stats TEXT NOT NULL,  -- JSON: { pelletCount, positivePelletCount, badges, exp, level, name, photo, licensePlate, state }
  role TEXT DEFAULT 'user',
  licensePlate TEXT,
  state TEXT,
  resetToken TEXT,
  resetTokenExpiry INTEGER
)
```

### Pellets Table
```sql
CREATE TABLE pellets (
  id TEXT PRIMARY KEY,
  targetLicensePlate TEXT NOT NULL,
  targetUserId TEXT,  -- NEW: Links to users.id, can be NULL if target isn't registered
  createdBy TEXT NOT NULL,  -- Links to users.id
  createdAt INTEGER NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'negative' or 'positive'
  latitude REAL,
  longitude REAL,
  FOREIGN KEY (createdBy) REFERENCES users(id),
  FOREIGN KEY (targetUserId) REFERENCES users(id)
)
```

### Badges Table
```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  badgeId TEXT NOT NULL,
  earnedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
)
```

## Next Steps

After applying these fixes:

1. ✅ Database schema is up-to-date with `targetUserId` column
2. ✅ Pellet creation automatically links to target users when possible
3. ✅ Better error messages help diagnose issues
4. ✅ Automatic migrations on database initialization

If you continue to experience issues, check the console logs for detailed error messages and refer to the "Common Issues & Solutions" section above.
