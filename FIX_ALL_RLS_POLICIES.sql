-- Completely disable RLS and remove all policies from all tables
-- This allows the backend to perform all operations without restrictions

-- Disable RLS and drop policies on users table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS and drop policies on badges table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'badges'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON badges', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE badges DISABLE ROW LEVEL SECURITY;

-- Disable RLS and drop policies on pellets table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'pellets'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON pellets', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE pellets DISABLE ROW LEVEL SECURITY;

-- Disable RLS and drop policies on activities table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'activities'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON activities', pol.policyname);
    END LOOP;
END $$;

ALTER TABLE activities DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled on all tables
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'badges', 'pellets', 'activities')
ORDER BY tablename;

-- Show that no policies exist on any table
SELECT 
    schemaname, 
    tablename, 
    policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'badges', 'pellets', 'activities')
ORDER BY tablename;
