# Forgot Password Feature

## Overview
A complete forgot password flow has been added to the authentication system, allowing users to reset their passwords using a 6-digit code.

## Features

### Backend Routes (tRPC)
1. **Request Reset** (`auth.requestReset`)
   - Generates a 6-digit reset token
   - Token expires after 15 minutes
   - Returns token for display (in development/testing)

2. **Verify Reset Token** (`auth.verifyResetToken`)
   - Validates the reset token
   - Checks token expiration
   - Returns success/error status

3. **Reset Password** (`auth.resetPassword`)
   - Validates token before resetting
   - Updates user password
   - Clears reset token after successful reset
   - Logs password reset activity

### Frontend Screens
1. **Forgot Password Screen** (`/(auth)/forgot-password`)
   - User enters email
   - Displays reset code (for development/testing)
   - Redirects to reset password screen

2. **Reset Password Screen** (`/(auth)/reset-password`)
   - User enters email, reset code, and new password
   - Validates password match and length
   - Redirects to login after successful reset

3. **Login Screen Updated**
   - Added "Forgot Password?" button
   - Links to forgot password flow

### Database Schema
Updated `users` table with:
- `resetToken TEXT` - Stores the 6-digit reset code
- `resetTokenExpiry INTEGER` - Timestamp when token expires

## User Flow
1. User clicks "Forgot Password?" on login screen
2. User enters email and receives 6-digit code
3. User enters code and new password on reset screen
4. Password is updated, user redirected to login
5. User logs in with new password

## Security Features
- Reset tokens expire after 15 minutes
- Tokens are cleared after successful password reset
- Case-insensitive email lookup
- Password minimum length validation (6 characters)
- Activity logging for password resets

## Development Notes
- In a production environment, the reset token should be sent via email (not displayed in the UI)
- Consider adding rate limiting for reset requests
- Consider adding additional validation (password strength requirements)
- The current implementation stores passwords in plain text - should be hashed in production
