# Turso Database Setup Guide

This project uses Turso DB as the backend database. Follow these steps to set up your Turso database:

## Prerequisites

1. Install the Turso CLI:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

## Setup Steps

### 1. Sign Up / Log In

```bash
turso auth signup
# or if you already have an account
turso auth login
```

### 2. Create a Database

```bash
turso db create your-database-name
```

### 3. Get Your Database URL

```bash
turso db show your-database-name --url
```

This will output something like: `libsql://your-database-name-[org].turso.io`

### 4. Create an Auth Token

```bash
turso db tokens create your-database-name
```

This will generate an authentication token for your database.

### 5. Set Environment Variables

Create a `.env` file in the root of your project (or add to your existing `.env` file):

```env
TURSO_DB_URL=libsql://your-database-name-[org].turso.io
TURSO_AUTH_TOKEN=your-generated-auth-token
```

**Important:** Never commit your `.env` file to version control. It should already be in your `.gitignore`.

## Database Schema

The application will automatically create the following tables on first run:

- **users**: Stores user accounts and profiles
- **badges**: Stores user badges and achievements
- **pellets**: Stores license plate notations created by users
- **activities**: Stores user activity logs for the admin area

## Verifying Your Setup

1. Start your application:
   ```bash
   npm start
   ```

2. Check the logs for:
   ```
   [Database] Turso database initialized successfully
   ```

3. If you see this message, your database is connected and ready to use!

## Troubleshooting

### "Database configuration missing"
- Make sure both `TURSO_DB_URL` and `TURSO_AUTH_TOKEN` are set in your `.env` file
- Restart your development server after adding environment variables

### "Failed to initialize database"
- Check that your database URL is correct
- Verify that your auth token hasn't expired
- Make sure you have internet connectivity

### Need to Reset Your Database?

To clear all data and start fresh:

```bash
turso db destroy your-database-name
turso db create your-database-name
```

Then update your `.env` file with the new database URL and token.

## Additional Turso Commands

```bash
# List all your databases
turso db list

# Open a SQL shell to your database
turso db shell your-database-name

# View database information
turso db show your-database-name

# Delete a database
turso db destroy your-database-name
```

## More Information

- [Turso Documentation](https://docs.turso.tech/)
- [Turso CLI Reference](https://docs.turso.tech/reference/turso-cli)
- [@libsql/client Documentation](https://github.com/libsql/libsql-client-ts)
