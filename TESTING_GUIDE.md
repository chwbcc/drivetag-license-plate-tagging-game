# Registration & Database Testing Guide

This guide will help you test the registration process and verify that user data is being properly saved to the Turso database.

## Prerequisites

Before testing, ensure:

1. **Environment Variables are Set**
   - `TURSO_DB_URL` - Your Turso database URL
   - `TURSO_AUTH_TOKEN` - Your Turso authentication token

2. **Backend is Running**
   - The Hono backend server should be running and accessible

## Running the Test Script

To run the automated test:

```bash
# From the project root
bun run backend/test-registration.ts
```

This will:
- ✅ Initialize the database connection
- ✅ Check existing users
- ✅ Create a test user
- ✅ Verify the user can be retrieved
- ✅ Check admin user status
- ✅ Test database connection

## Manual Testing Steps

### 1. Test New User Registration

1. Open the app and navigate to the registration screen
2. Fill in the form with test data:
   - **Name**: Test User
   - **Email**: test@example.com
   - **License Plate**: TEST123
   - **State**: CA
   - **Password**: TestPassword123
   - **Confirm Password**: TestPassword123

3. Click "Create Account"

4. **Expected Results**:
   - User is created successfully
   - User receives 10 negative pellets and 5 positive pellets
   - User is automatically logged in
   - User is redirected to the main app (tabs)

### 2. Verify Data in Database

You can verify the registration worked by:

#### Option A: Using the test script
```bash
bun run backend/test-registration.ts
```

#### Option B: Check through admin panel
1. Log in as admin (chwbcc@gmail.com)
2. Navigate to Admin → Users
3. You should see the newly registered user in the list

#### Option C: Direct database query
If you have Turso CLI installed:
```bash
turso db shell your-database-name "SELECT * FROM users;"
```

### 3. Test Admin User (chwbcc@gmail.com)

The admin user needs to register through the app first:

1. Go to registration screen
2. Register with:
   - **Email**: chwbcc@gmail.com
   - **License Plate**: Your license plate
   - **State**: Your state
   - **Password**: Your chosen password

3. After registration, the user will have `super_admin` role assigned automatically

4. **Verify Admin Access**:
   - Log in with chwbcc@gmail.com
   - You should see an "Admin" link at the top of the app
   - Click it to access the admin panel
   - You should have full access to all admin features

## What Data is Stored?

When a user registers, the following data is saved to the Turso database:

### Users Table
- `id` - Unique user identifier
- `email` - User's email (unique)
- `username` - User's name
- `passwordHash` - User's password (stored as-is, consider hashing in production)
- `createdAt` - Timestamp when user was created
- `stats` - JSON string containing:
  - `pelletCount` - Number of negative pellets (starts at 10)
  - `positivePelletCount` - Number of positive pellets (starts at 5)
  - `badges` - Array of earned badges
  - `exp` - Experience points
  - `level` - User level
  - `name` - Display name
  - `photo` - Profile photo URL (optional)
  - `licensePlate` - User's license plate
  - `state` - License plate state
- `role` - User's admin role (user, moderator, admin, super_admin)

### Activities Table
- Logs when user registers with `user_registered` action type
- Tracks all user activities

## Troubleshooting

### "UNAUTHORIZED" Error
- Check that backend is running
- Verify environment variables are set correctly
- Check network connectivity

### "JSON Parse error"
- Usually means backend returned non-JSON response
- Check backend logs for actual error
- Verify database connection

### User Not Saved to Database
- Check backend logs for errors
- Verify `TURSO_DB_URL` and `TURSO_AUTH_TOKEN` are correct
- Run the test script to verify database connectivity

### Admin Button Not Showing
- Make sure you registered with chwbcc@gmail.com
- Check user's role in database (should be 'super_admin')
- Try logging out and back in
- Clear app cache and restart

## Checking Backend Logs

Backend logs will show:
```
[Auth] Registering user: test@example.com
[UserService] Created user: test@example.com
[Auth] User registered successfully: test@example.com
```

If you see errors in the logs, they will indicate what went wrong.

## Database Schema Verification

To verify your database schema is correct, the tables should exist:

1. **users** - Stores user accounts and data
2. **badges** - Stores user badges
3. **pellets** - Stores pellet records  
4. **activities** - Stores user activity logs

These tables are automatically created when `initDatabase()` is called.

## Success Criteria

Registration is working correctly when:
- ✅ New users can register without errors
- ✅ User data appears in the database
- ✅ Users receive 10 negative + 5 positive pellets
- ✅ Users are automatically logged in after registration
- ✅ Activity log shows "user_registered" event
- ✅ Admin user (chwbcc@gmail.com) has super_admin role
- ✅ Admin user can access admin panel

## Next Steps

After confirming registration works:
1. Test login functionality
2. Test pellet creation and tracking
3. Test admin features
4. Test user profile updates
5. Consider implementing password hashing for security
