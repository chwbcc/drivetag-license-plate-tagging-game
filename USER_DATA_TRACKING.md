# User Data Tracking Documentation

This document explains how all user actions and data are tracked in the application for future admin area implementation.

## Overview

All user-entered data is now associated with user accounts through unique user IDs. This enables comprehensive tracking of user behavior and actions for admin monitoring and analytics.

## Data Structures

### 1. Pellet System (Tag Notifications)

**Location**: `store/pellet-store.ts`

Each pellet (tag/notation on a license plate) contains:
- `id`: Unique pellet identifier
- `targetLicensePlate`: The license plate being tagged (format: "STATE-PLATE")
- `createdBy`: **User ID** of the person who created the tag
- `createdAt`: Timestamp of creation
- `reason`: Description of the driving behavior
- `type`: 'negative' or 'positive'
- `location`: Optional GPS coordinates

**Example**:
```typescript
{
  id: "1234567890",
  targetLicensePlate: "CA-ABC123",
  createdBy: "user-123", // User ID who tagged
  createdAt: 1732723200000,
  reason: "Cutting off other drivers",
  type: "negative",
  location: { latitude: 37.7749, longitude: -122.4194 }
}
```

### 2. License Plate Game (State Spottings)

**Location**: `store/license-plate-game-store.ts`

Each spotted license plate state contains:
- `state`: State code (e.g., "CA", "NY")
- `spottedAt`: Timestamp of when spotted
- `count`: Number of times spotted
- `userId`: **User ID** of the person who spotted it

**Storage Key**: `@license_plate_spottings_v2_{userId}`

**Example**:
```typescript
{
  "CA": {
    state: "CA",
    spottedAt: 1732723200000,
    count: 5,
    userId: "user-123" // User who spotted it
  }
}
```

### 3. User Profile

**Location**: `store/auth-store.ts`

Each user account contains:
- `id`: Unique user identifier
- `email`: User email
- `name`: User display name
- `licensePlate`: User's license plate
- `state`: User's state
- `pelletCount`: Number of negative pellets available
- `positivePelletCount`: Number of positive pellets available
- `badges`: Array of earned badge IDs
- `exp`: Experience points
- `level`: User level

### 4. Payment History

**Location**: `store/payment-store.ts` (if implemented)

Payment records contain:
- `userId`: **User ID** who made the purchase
- `itemId`: What was purchased
- `amount`: Purchase amount
- `date`: Purchase timestamp
- `status`: 'completed', 'pending', or 'failed'

## Admin Tracking Capabilities

With the current data structure, you can track:

### Per User:
1. **All tags created**: Query pellets by `createdBy` field
2. **All license plates spotted**: Query spottings by `userId` field
3. **Purchase history**: Query payments by `userId` field
4. **Badge progress**: View user's badges array
5. **Experience/Level**: View user's exp and level
6. **Pellet balance**: View pelletCount and positivePelletCount

### Global Analytics:
1. **Most tagged license plates**: Group pellets by `targetLicensePlate`
2. **Most active users**: Count pellets per `createdBy`
3. **Positive vs negative ratio**: Filter pellets by `type`
4. **Geographic data**: Analyze pellet `location` fields
5. **Time-based patterns**: Analyze `createdAt` timestamps

## Implementation for Admin Area

To build an admin dashboard, you can:

1. **Query all pellets created by a user**:
   ```typescript
   const userPellets = usePelletStore.getState().getPelletsCreatedByUser(userId);
   ```

2. **Query all pellets received by a license plate**:
   ```typescript
   const platePellets = usePelletStore.getState().getPelletsByLicensePlate(licensePlate);
   ```

3. **Get user's license plate game progress**:
   ```typescript
   // Load user's spottings from AsyncStorage
   const userKey = `@license_plate_spottings_v2_${userId}`;
   const spottings = await AsyncStorage.getItem(userKey);
   ```

4. **Get all registered users**:
   ```typescript
   const allUsers = useAuthStore.getState().getAllUsers();
   ```

## Data Migration Note

The license plate game storage key was updated from `@license_plate_spottings` to `@license_plate_spottings_v2` to ensure clean user-specific tracking. Old data without user IDs will not be migrated.

## Backend Integration (Future)

For scalability and proper admin tracking, consider:
1. Moving from AsyncStorage to a backend database
2. Creating API endpoints for admin queries
3. Implementing real-time analytics
4. Adding user action logging
5. Creating audit trails for all modifications

## Privacy Considerations

When implementing the admin area:
- Ensure proper authentication and authorization
- Implement role-based access control (RBAC)
- Consider data retention policies
- Comply with privacy regulations (GDPR, CCPA, etc.)
- Allow users to request their data
- Provide options for data deletion
