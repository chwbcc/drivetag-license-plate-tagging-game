# Quick Test Instructions

## Run the Verification Script

Test your registration system and database:

```bash
bun run backend/verify-system.ts
```

This comprehensive test will check:
- Database connectivity
- Database schema
- User creation and retrieval  
- Admin user status
- Default pellet allocation
- Environment configuration

## Manual Testing Steps

### 1. Register a New User
1. Open the app
2. Navigate to register screen
3. Fill in:
   - Email: test@example.com
   - License Plate: TEST123
   - State: CA
   - Password: TestPassword123
4. Click "Create Account"
5. Should redirect to main app with 10 negative pellets and 5 positive pellets

### 2. Register Admin User
1. Open the app
2. Register with email: **chwbcc@gmail.com**
3. Complete registration
4. User will automatically get `super_admin` role
5. Should see "Admin" button at top of app

### 3. Verify in Database
Run the verification script again:
```bash
bun run backend/verify-system.ts
```

Check that:
- ✅ New users appear in the list
- ✅ chwbcc@gmail.com has super_admin role
- ✅ All tests pass

## Troubleshooting

**Database connection fails?**
- Check `.env` file has `TURSO_DB_URL` and `TURSO_AUTH_TOKEN`

**Admin button not showing?**
- Register with chwbcc@gmail.com through the app
- Log out and log back in

**Registration fails?**
- Check backend logs in console
- Verify environment variables are set
- Try running verification script for detailed errors

See `TESTING_GUIDE.md` for complete documentation.
