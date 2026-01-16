# Database Schema Reference

This document defines the expected database schema for the application.

## Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  name TEXT,
  photo TEXT,
  license_plate TEXT,
  state TEXT,
  created_at BIGINT,
  role TEXT DEFAULT 'user',
  experience INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  negative_pellet_count INTEGER DEFAULT 10,
  positive_pellet_count INTEGER DEFAULT 5,
  positive_rating_count INTEGER DEFAULT 0,
  negative_rating_count INTEGER DEFAULT 0,
  pellets_given_count INTEGER DEFAULT 0,
  positive_pellets_given_count INTEGER DEFAULT 0,
  negative_pellets_given_count INTEGER DEFAULT 0,
  badges TEXT DEFAULT '[]'
);
```

## Pellets Table
```sql
CREATE TABLE pellets (
  id TEXT PRIMARY KEY,
  license_plate TEXT NOT NULL,
  targetuserid TEXT,
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  notes TEXT,
  type TEXT NOT NULL,
  latitude REAL,
  longitude REAL
);
```

## Badges Table
```sql
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  userid TEXT NOT NULL,
  badgeid TEXT NOT NULL,
  earned_at BIGINT NOT NULL
);
```

## Activities Table
```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  userid TEXT NOT NULL,
  actiontype TEXT NOT NULL,
  actiondata TEXT,
  created_at BIGINT NOT NULL
);
```

## Important Notes

1. All column names should be in lowercase with underscores (snake_case)
2. The pellets table uses `created_by` not `createdby`
3. The pellets table uses `notes` for the reason field
4. User counts should be initialized properly when creating users
5. Make sure RLS (Row Level Security) policies allow proper access
