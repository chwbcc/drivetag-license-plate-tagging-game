# Add Super Admin to Turso Database

This script adds a super admin user to your Turso database.

## Prerequisites

1. Ensure your Turso database credentials are set in your environment variables:
   - `TURSO_DB_URL`
   - `TURSO_AUTH_TOKEN`

2. Make sure your database is properly initialized

## Usage

Run the script using bun:

```bash
bun backend/add-super-admin.ts
```

## Default Credentials

The script will create a super admin with the following credentials:

- **Email:** `admin@pelletapp.com`
- **Password:** `SuperAdmin123!`
- **License Plate:** `ADMIN1`
- **State:** `CA`
- **Role:** `super_admin`

## Important Notes

1. If a user with the email already exists, the script will update their role to `super_admin`
2. The super admin will have 1000 negative pellets and 1000 positive pellets
3. **IMPORTANT:** Change the password after first login for security!

## Customizing Credentials

To use different credentials, edit the `backend/add-super-admin.ts` file and change these values:

```typescript
const email = 'admin@pelletapp.com';
const password = 'SuperAdmin123!';
const name = 'Super Admin';
const licensePlate = 'ADMIN1';
const state = 'CA';
```

## Testing the Super Admin

After running the script, you can log in to the app using:
- Email: `admin@pelletapp.com`
- Password: `SuperAdmin123!`

The super admin will have access to all admin features including:
- User management
- Pellet management
- Activity logs
- System settings
