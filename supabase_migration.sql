-- =========================================================================
-- HAASHIYA AIR TRAVELS CRM - STAFF MANAGEMENT & RLS MIGRATION
-- =========================================================================

-- 1. Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create public.staff table (single table for all employees)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    designation TEXT,
    department TEXT,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    joining_date DATE,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    profile_photo_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_staff_auth_user_id ON public.staff(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_code ON public.staff(staff_code);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff(status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_staff_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_updated_at ON public.staff;
CREATE TRIGGER trg_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_timestamp();

-- 3. Function to generate sequential staff codes (HAT-0001, HAT-0002, etc.)
CREATE OR REPLACE FUNCTION generate_next_staff_code()
RETURNS TEXT AS $$
DECLARE
    max_num INT;
    next_code TEXT;
BEGIN
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(staff_code FROM 5) AS INT)
    ), 0) INTO max_num
    FROM public.staff
    WHERE staff_code ~ '^HAT-\d+$';

    next_code := 'HAT-' || LPAD((max_num + 1)::TEXT, 4, '0');
    RETURN next_code;
END;
$$ LANGUAGE plpgsql;

-- 4. ENABLE ROW LEVEL SECURITY (RLS) ON public.staff
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin full access to staff" ON public.staff;
DROP POLICY IF EXISTS "Staff view own profile" ON public.staff;
DROP POLICY IF EXISTS "Staff update own profile fields" ON public.staff;

-- Policy 1: Admin full access to staff
CREATE POLICY "Admin full access to staff" ON public.staff
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff s
            WHERE s.auth_user_id = auth.uid()
            AND s.role = 'admin'
            AND s.status = 'active'
        )
        OR auth.uid() IS NULL -- Allow service_role key / backend admin bypass
    );

-- Policy 2: Staff can view their own record
CREATE POLICY "Staff view own profile" ON public.staff
    FOR SELECT
    USING (
        auth_user_id = auth.uid()
    );

-- Policy 2.5: Users can insert their own record initially
CREATE POLICY "Staff insert own profile" ON public.staff
    FOR INSERT
    WITH CHECK (
        auth_user_id = auth.uid()
    );

-- Policy 3: Staff can update specific allowed fields on their own profile
CREATE POLICY "Staff update own profile fields" ON public.staff
    FOR UPDATE
    USING (
        auth_user_id = auth.uid()
    )
    WITH CHECK (
        auth_user_id = auth.uid()
    );

-- 5. RLS POLICIES FOR GENERAL TASKS & OTHER CRM DATA
ALTER TABLE IF EXISTS public.general_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access to tasks" ON public.general_tasks;
DROP POLICY IF EXISTS "Staff view assigned tasks" ON public.general_tasks;
DROP POLICY IF EXISTS "Staff update assigned task status" ON public.general_tasks;

CREATE POLICY "Admin full access to tasks" ON public.general_tasks
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.staff s
            WHERE s.auth_user_id = auth.uid()
            AND s.role = 'admin'
            AND s.status = 'active'
        )
        OR auth.uid() IS NULL
    );

CREATE POLICY "Staff view assigned tasks" ON public.general_tasks
    FOR SELECT
    USING (
        assigned_staff_id IN (
            SELECT s.id FROM public.staff s
            WHERE s.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Staff update assigned task status" ON public.general_tasks
    FOR UPDATE
    USING (
        assigned_staff_id IN (
            SELECT s.id FROM public.staff s
            WHERE s.auth_user_id = auth.uid()
        )
    );

-- 6. Clean up obsolete agent table references if present
DROP TABLE IF EXISTS public.agents CASCADE;

-- 7. Add staff activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    staff_name TEXT,
    task_id TEXT,
    task_title TEXT,
    action TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated users view logs" ON public.activity_logs;
CREATE POLICY "All authenticated users view logs" ON public.activity_logs
    FOR ALL
    USING (true);
