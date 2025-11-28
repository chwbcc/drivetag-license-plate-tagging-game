# Turso Database Setup Guide

This project uses Turso, a cloud-based SQLite database service built on libSQL.

## Prerequisites

You need to have the Turso CLI installed and be logged in.

## Installation Steps

### 1. Install Turso CLI

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

For other installation methods, visit: https://docs.turso.tech/cli/installation

### 2. Sign Up and Login

```bash
turso auth signup
turso auth login
```

### 3. Create Your Database

```bash
turso db create driver-score-db
```

You can choose any name for your database, but we recommend `driver-score-db`.

### 4. Get Your Database URL

```bash
turso db show driver-score-db --url
```

Copy the URL output. It will look something like:
```
libsql://driver-score-db-yourname.turso.io
```

### 5. Create an Authentication Token

```bash
turso db tokens create driver-score-db
```

Copy the token output. It's a long string starting with `eyJ...`

### 6. Set Environment Variables

You need to set these environment variables:

#### For Development (Local)

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
TURSO_DATABASE_URL=libsql://driver-score-db-yourname.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...your-token-here
```

#### For Production/Deployment

Set these environment variables in your hosting platform:
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

**Important:** Never commit your `.env` file to git. Make sure it's in your `.gitignore`.

## Database Schema

The database includes the following tables:

### users
- id (TEXT PRIMARY KEY)
- email (TEXT NOT NULL UNIQUE)
- password (TEXT)
- name (TEXT)
- photo (TEXT)
- license_plate (TEXT NOT NULL)
- state (TEXT)
- pellet_count (INTEGER DEFAULT 0)
- positive_pellet_count (INTEGER DEFAULT 0)
- exp (INTEGER DEFAULT 0)
- level (INTEGER DEFAULT 1)
- admin_role (TEXT)
- created_at (INTEGER NOT NULL)
- updated_at (INTEGER NOT NULL)

### badges
- id (TEXT PRIMARY KEY)
- user_id (TEXT NOT NULL)
- badge_id (TEXT NOT NULL)
- earned_at (INTEGER NOT NULL)

### pellets
- id (TEXT PRIMARY KEY)
- target_license_plate (TEXT NOT NULL)
- created_by (TEXT NOT NULL)
- created_at (INTEGER NOT NULL)
- reason (TEXT NOT NULL)
- type (TEXT NOT NULL CHECK(type IN ('negative', 'positive')))
- latitude (REAL)
- longitude (REAL)

### user_activity
- id (TEXT PRIMARY KEY)
- user_id (TEXT NOT NULL)
- action_type (TEXT NOT NULL)
- action_data (TEXT)
- created_at (INTEGER NOT NULL)

### license_plate_spottings
- id (TEXT PRIMARY KEY)
- user_id (TEXT NOT NULL)
- state_code (TEXT NOT NULL)
- spotted_at (INTEGER NOT NULL)
- count (INTEGER DEFAULT 1)

The database is automatically initialized with these tables when the backend starts.

## Useful Turso Commands

### View Your Database

```bash
turso db show driver-score-db
```

### List All Databases

```bash
turso db list
```

### Open Database Shell

```bash
turso db shell driver-score-db
```

Inside the shell, you can run SQL queries:
```sql
-- View all users
SELECT * FROM users;

-- Count users
SELECT COUNT(*) FROM users;

-- View recent pellets
SELECT * FROM pellets ORDER BY created_at DESC LIMIT 10;
```

### Create a New Token (if needed)

```bash
turso db tokens create driver-score-db
```

### Delete Database (careful!)

```bash
turso db destroy driver-score-db
```

## Data Migration

If you have existing data in your local/in-memory database, you'll need to migrate it. The old in-memory data will not automatically transfer to Turso.

## Troubleshooting

### Error: "TURSO_DATABASE_URL is not set"

Make sure you've set the environment variables correctly. Check that:
1. Your `.env` file exists in the project root
2. The variables are spelled correctly
3. There are no extra spaces around the values

### Connection Issues

- Verify your token hasn't expired (tokens don't expire by default, but can be set to)
- Check your internet connection
- Ensure the database URL is correct

### View Logs

The backend logs database initialization and errors. Check your console output for messages starting with `[Database]`.

## Resources

- Turso Documentation: https://docs.turso.tech/
- Turso Dashboard: https://turso.tech/app
- libSQL Client Documentation: https://github.com/tursodatabase/libsql-client-ts

## Support

If you encounter issues:
1. Check the logs for error messages
2. Verify your environment variables are set correctly
3. Try accessing the database shell to verify connectivity
4. Check Turso's status page: https://status.turso.tech/
