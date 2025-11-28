# Registration Error Fix

## Issue
You're encountering the error: "Failed to register user"

## Root Cause
The most likely cause is that your `.env` file is missing or doesn't have the correct Turso database credentials.

## Solution Steps

### 1. Check if `.env` file exists
In your project root directory, look for a file named `.env`. If it doesn't exist, you need to create it.

### 2. Add Turso Credentials to `.env` file

Your `.env` file should contain:

```
TURSO_DB_URL=libsql://pellet-app-[your-name].turso.io
TURSO_AUTH_TOKEN=your-actual-auth-token-here
```

### 3. How to Get Your Turso Credentials

If you already have a Turso database set up:

```bash
# List your databases
turso db list

# Get the URL for your database
turso db show pellet-app

# Get/create an auth token
turso db tokens create pellet-app
```

If you haven't set up Turso yet, follow `TURSO_SETUP.md`.

### 4. Verify Your `.env` File

Your `.env` file should look something like this:

```
TURSO_DB_URL=libsql://pellet-app-myname.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3M...
```

**Important:** 
- Make sure there are NO spaces around the `=` sign
- Make sure there are NO quotes around the values
- The auth token should be a long string starting with `eyJ`

### 5. Restart Your Development Server

After updating the `.env` file, you MUST restart your development server:

1. Stop the current server (Ctrl+C or Cmd+C)
2. Start it again with: `npm start` or `bun start`

### 6. Test Registration Again

Try registering a new user. You should now see detailed logs in your server console showing:
- `[Database] TURSO_DB_URL: SET`
- `[Database] TURSO_AUTH_TOKEN: SET`
- `[Database] Client created successfully`
- `[Database] Tables created/verified successfully`

## What Changed

I've added better error logging to help diagnose database connection issues:

1. **backend/database.ts** - Now logs whether environment variables are set
2. **backend/trpc/routes/auth/register/route.ts** - More detailed error messages
3. **backend/services/user-service.ts** - Better error handling when creating users

## Still Having Issues?

If you're still seeing errors after following these steps:

1. Check your server console logs for detailed error messages
2. Make sure your Turso database is accessible
3. Try running: `turso db show pellet-app` to verify the database exists
4. Check that your auth token hasn't expired

## Testing the Database Connection

You can test your database connection by running:

```bash
bun backend/check-database-connection.ts
```

This will verify that your `.env` file is configured correctly and the database is accessible.
