export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- HAASHIYA AIR TRAVELS CRM - SUPABASE PRODUCTION DATABASE SCHEMA
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff 
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

-- 4. General Tasks
CREATE TABLE IF NOT EXISTS public.general_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number TEXT UNIQUE NOT NULL,
    service_type TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    assigned_staff_id UUID REFERENCES public.staff(id),
    status TEXT NOT NULL DEFAULT 'Pending',
    priority TEXT NOT NULL DEFAULT 'Medium',
    due_date TIMESTAMPTZ,
    notes TEXT,
    fee_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ticket Bookings
CREATE TABLE IF NOT EXISTS public.ticket_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    airline TEXT NOT NULL,
    departure_airport TEXT NOT NULL,
    arrival_airport TEXT NOT NULL,
    departure_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confirmed',
    total_amount NUMERIC DEFAULT 0,
    assigned_staff_id UUID REFERENCES public.staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Follow Ups
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    mobile_number TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    scheduled_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    agent_id UUID REFERENCES public.staff(id),
    agent_name TEXT,
    agent_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enquiries
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    phone TEXT,
    service_interested TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    notes TEXT,
    assigned_staff_id UUID REFERENCES public.staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Passport Processes
CREATE TABLE IF NOT EXISTS public.passport_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    passport_number TEXT,
    service_type TEXT,
    status TEXT NOT NULL DEFAULT 'Initiated',
    assigned_staff_id UUID REFERENCES public.staff(id),
    total_fee NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    logged_by UUID REFERENCES public.staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES public.staff(id),
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all CRM tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow Public / Anon Key Reads & Writes for Web App Interface
-- Customers
DROP POLICY IF EXISTS "Allow public read access" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert access" ON public.customers;
DROP POLICY IF EXISTS "Allow public update access" ON public.customers;
DROP POLICY IF EXISTS "Allow public delete access" ON public.customers;
CREATE POLICY "Allow public read access" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.customers FOR DELETE USING (true);

-- Staff
DROP POLICY IF EXISTS "Allow public read access" ON public.staff;
DROP POLICY IF EXISTS "Allow public insert access" ON public.staff;
DROP POLICY IF EXISTS "Allow public update access" ON public.staff;
DROP POLICY IF EXISTS "Allow public delete access" ON public.staff;
CREATE POLICY "Allow public read access" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.staff FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.staff FOR DELETE USING (true);

-- General Tasks
DROP POLICY IF EXISTS "Allow public read access" ON public.general_tasks;
DROP POLICY IF EXISTS "Allow public insert access" ON public.general_tasks;
DROP POLICY IF EXISTS "Allow public update access" ON public.general_tasks;
DROP POLICY IF EXISTS "Allow public delete access" ON public.general_tasks;
CREATE POLICY "Allow public read access" ON public.general_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.general_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.general_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.general_tasks FOR DELETE USING (true);

-- Ticket Bookings
DROP POLICY IF EXISTS "Allow public read access" ON public.ticket_bookings;
DROP POLICY IF EXISTS "Allow public insert access" ON public.ticket_bookings;
DROP POLICY IF EXISTS "Allow public update access" ON public.ticket_bookings;
DROP POLICY IF EXISTS "Allow public delete access" ON public.ticket_bookings;
CREATE POLICY "Allow public read access" ON public.ticket_bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.ticket_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.ticket_bookings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.ticket_bookings FOR DELETE USING (true);

-- Follow Ups
DROP POLICY IF EXISTS "Allow public read access" ON public.follow_ups;
DROP POLICY IF EXISTS "Allow public insert access" ON public.follow_ups;
DROP POLICY IF EXISTS "Allow public update access" ON public.follow_ups;
DROP POLICY IF EXISTS "Allow public delete access" ON public.follow_ups;
CREATE POLICY "Allow public read access" ON public.follow_ups FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.follow_ups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.follow_ups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.follow_ups FOR DELETE USING (true);

-- Enquiries
DROP POLICY IF EXISTS "Allow public read access" ON public.enquiries;
DROP POLICY IF EXISTS "Allow public insert access" ON public.enquiries;
DROP POLICY IF EXISTS "Allow public update access" ON public.enquiries;
DROP POLICY IF EXISTS "Allow public delete access" ON public.enquiries;
CREATE POLICY "Allow public read access" ON public.enquiries FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.enquiries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.enquiries FOR DELETE USING (true);

-- Passport Processes
DROP POLICY IF EXISTS "Allow public read access" ON public.passport_processes;
DROP POLICY IF EXISTS "Allow public insert access" ON public.passport_processes;
DROP POLICY IF EXISTS "Allow public update access" ON public.passport_processes;
DROP POLICY IF EXISTS "Allow public delete access" ON public.passport_processes;
CREATE POLICY "Allow public read access" ON public.passport_processes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.passport_processes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.passport_processes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.passport_processes FOR DELETE USING (true);

-- Expenses
DROP POLICY IF EXISTS "Allow public read access" ON public.expenses;
DROP POLICY IF EXISTS "Allow public insert access" ON public.expenses;
DROP POLICY IF EXISTS "Allow public update access" ON public.expenses;
DROP POLICY IF EXISTS "Allow public delete access" ON public.expenses;
CREATE POLICY "Allow public read access" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.expenses FOR DELETE USING (true);

-- Activity Logs
DROP POLICY IF EXISTS "Allow public read access" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow public insert access" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow public update access" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow public delete access" ON public.activity_logs;
CREATE POLICY "Allow public read access" ON public.activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.activity_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.activity_logs FOR DELETE USING (true);

`;
