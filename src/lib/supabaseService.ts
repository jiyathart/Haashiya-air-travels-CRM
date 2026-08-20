import { supabase, isSupabaseConfigured } from './supabase';
import { api } from '../api';
import { StaffUser, Customer, Enquiry, Expense, FollowUp, TicketBooking, PassportProcess, GeneralTask, DeletedRecord } from '../types';

export { isSupabaseConfigured };

// Helper to access Supabase tables without strict type inference issues
function db(tableName: string) {
  if (!supabase) throw new Error('Supabase is not configured');
  return (supabase.from as any)(tableName);
}

// Local Storage Fallback Helpers
function getLocalItems<T>(key: string, initialSeed: T[] = []): T[] {
  try {
    const stored = localStorage.getItem(`haashiya_local_${key}`);
    if (!stored) {
      localStorage.setItem(`haashiya_local_${key}`, JSON.stringify(initialSeed));
      return initialSeed;
    }
    return JSON.parse(stored);
  } catch {
    return initialSeed;
  }
}

function saveLocalItems<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(`haashiya_local_${key}`, JSON.stringify(items));
  } catch (err) {
    console.warn(`Failed to save ${key} to local storage`, err);
  }
}

const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Mohammed Al-Rashid',
    mobile_number: '+91 98765 43210',
    email: 'm.rashid@gmail.com',
    address: 'Mumbai, Maharashtra',
    passport_number: 'Z1234567',
    agent_code: 'AGT-0001',
    agent_name: 'Administrator',
    created_at: new Date().toISOString()
  },
  {
    id: 'cust-2',
    name: 'Priya Sundaram',
    mobile_number: '+91 98123 98765',
    email: 'priya.sundaram@yahoo.com',
    address: 'Chennai, Tamil Nadu',
    passport_number: 'K9876543',
    agent_code: 'AGT-0002',
    agent_name: 'Raman Sharma',
    created_at: new Date().toISOString()
  }
];

const SEED_ENQUIRIES: Enquiry[] = [
  {
    id: 'enq-1',
    customer_name: 'Fatima Zahra',
    mobile_number: '+91 99887 76655',
    service_type: 'Flight Booking',
    description: 'Require 2 round-trip tickets Mumbai to Jeddah for Umrah package in October.',
    status: 'New',
    expected_date: '2026-10-15',
    created_at: new Date().toISOString()
  },
  {
    id: 'enq-2',
    customer_name: 'Suresh Menon',
    mobile_number: '+91 97766 55443',
    service_type: 'Passport Renewal',
    description: 'Expiring in 3 months, needs urgent Tatkal renewal appointment.',
    status: 'In Progress',
    expected_date: '2026-08-25',
    created_at: new Date().toISOString()
  }
];

const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'Office Rent & Utilities',
    description: 'Monthly office maintenance and electricity bill',
    amount: 15000,
    date: new Date().toISOString().split('T')[0],
    payment_mode: 'Bank Transfer',
    created_at: new Date().toISOString()
  },
  {
    id: 'exp-2',
    category: 'Travel & Courier',
    description: 'Passport dispatch courier fees to RPO',
    amount: 1200,
    date: new Date().toISOString().split('T')[0],
    payment_mode: 'UPI',
    created_at: new Date().toISOString()
  }
];

const SEED_FOLLOWUPS: FollowUp[] = [
  {
    id: 'fup-1',
    customer_name: 'Fatima Zahra',
    mobile_number: '+91 99887 76655',
    title: 'Confirm Umrah Package Flight Schedule',
    notes: 'Call customer to finalize flight preferences and passport copies.',
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'Pending',
    created_at: new Date().toISOString()
  }
];

export const supabaseService = {
  // =========================================================================
  // 1. STAFF MANAGEMENT
  // =========================================================================

  /**
   * Syncs the authenticated Supabase user to the internal public.staff table.
   * Auto-creates the staff record if it doesn't exist.
   */
  async syncUserToStaff(authUser: { id: string, email?: string, full_name?: string }): Promise<StaffUser | null> {
    if (!supabase) return null;

    try {
      const email = authUser.email || '';

      // 1. Try fetching by auth_user_id
      const { data: byAuth, error: authErr } = await db('staff')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (!authErr && byAuth) {
        return this.mapStaffRecord(byAuth);
      }

      // 2. Try fetching by email
      if (email) {
        const { data: byEmail, error: emailErr } = await db('staff')
          .select('*')
          .ilike('email', email)
          .maybeSingle();

        if (!emailErr && byEmail) {
          // Link missing auth_user_id
          if (!byEmail.auth_user_id) {
            await db('staff').update({ auth_user_id: authUser.id }).eq('id', byEmail.id);
          }
          return this.mapStaffRecord({ ...byEmail, auth_user_id: authUser.id });
        }
      }

      // 3. Auto-create if not found
      const isFirstOrAdmin = email.toLowerCase().includes('admin') || email.toLowerCase() === 'jiyathart@gmail.com';
      const newStaff = {
        auth_user_id: authUser.id,
        staff_code: `HAT-${Math.floor(1000 + Math.random() * 9000)}`,
        full_name: authUser.full_name || email.split('@')[0] || 'New User',
        email: email,
        role: isFirstOrAdmin ? 'admin' : 'staff',
        status: 'active',
        designation: isFirstOrAdmin ? 'Administrator' : 'Staff',
        department: isFirstOrAdmin ? 'Management' : 'General',
      };

      const { data: created, error: createErr } = await db('staff')
        .insert([newStaff])
        .select()
        .single();

      if (!createErr && created) {
        return this.mapStaffRecord(created);
      } else {
        console.error('Failed to auto-create staff record during syncUserToStaff:', createErr);
        // Do not throw, return null to let authService handle it gracefully if possible
        return null;
      }
    } catch (err) {
      console.error('Error in syncUserToStaff:', err);
      return null;
    }
  },

  mapStaffRecord(s: any): StaffUser {
    return {
      id: s.id,
      auth_user_id: s.auth_user_id,
      staff_code: s.staff_code || 'HAT-0000',
      full_name: s.full_name || s.name || 'Staff Member',
      name: s.full_name || s.name || 'Staff Member',
      username: s.username || s.full_name || s.email?.split('@')[0] || 'user',
      email: s.email,
      phone: s.phone || '',
      designation: s.designation || '',
      department: s.department || '',
      role: (s.role === 'admin' || s.role === 'Admin') ? 'admin' : 'staff',
      active: s.status === 'active' && s.active !== false,
      status: (s.status === 'inactive' || s.active === false) ? 'inactive' : 'active',
      joining_date: s.joining_date || '',
      address: s.address || '',
      emergency_contact_name: s.emergency_contact_name || '',
      emergency_contact_phone: s.emergency_contact_phone || '',
      profile_photo_url: s.profile_photo_url || '',
      notes: s.notes || '',
      created_at: s.created_at,
      updated_at: s.updated_at,
    };
  },

  async getStaff(): Promise<StaffUser[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await db('staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching staff from Supabase:', error);
        return [];
      }

      // Fetch task counts per staff
      const { data: tasks } = await db('general_tasks').select('assigned_staff_id, status');

      const staffList = (data || []).map((s: any) => {
        const assignedTaskCount = (tasks || []).filter((t: any) => t.assigned_staff_id === s.id && t.status !== 'Completed' && t.status !== 'Delivered' && t.status !== 'Ready / Completed').length;

        return {
          id: s.id,
          auth_user_id: s.auth_user_id,
          staff_code: s.staff_code || 'HAT-0000',
          full_name: s.full_name || s.name || 'Staff Member',
          name: s.full_name || s.name || 'Staff Member',
          email: s.email,
          phone: s.phone || '',
          designation: s.designation || '',
          department: s.department || '',
          role: (s.role === 'admin' || s.role === 'Admin') ? 'admin' : 'staff',
          active: s.status === 'active' && s.active !== false,
          status: (s.status === 'inactive' || s.active === false) ? 'inactive' : 'active',
          joining_date: s.joining_date || '',
          address: s.address || '',
          emergency_contact_name: s.emergency_contact_name || '',
          emergency_contact_phone: s.emergency_contact_phone || '',
          profile_photo_url: s.profile_photo_url || '',
          notes: s.notes || '',
          created_at: s.created_at,
          updated_at: s.updated_at,
          assignedTaskCount
        };
      }) as StaffUser[];

      return staffList;
    } catch {
      return [];
    }
  },

  async getActiveStaff(): Promise<StaffUser[]> {
    const all = await this.getStaff();
    return all.filter(s => s.status === 'active' && s.active !== false);
  },

  async createStaff(payload: any): Promise<{ success: boolean; message?: string; staff?: StaffUser }> {
    try {
      const response = await fetch('/api/create-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      const isNonJson = !contentType.includes('application/json') || responseText.trim().startsWith('<') || responseText.trim().startsWith('The page');

      if (isNonJson) {
        console.warn('/api/create-staff returned HTML/non-JSON response from server host. Executing Supabase/Client fallback.');
        return await this.createStaffFallback(payload);
      }

      let resData: any = {};
      try {
        resData = JSON.parse(responseText);
      } catch {
        return await this.createStaffFallback(payload);
      }

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to create staff account.');
      }
      return { success: true, message: 'Staff account created successfully.', staff: resData.staff };
    } catch (err: any) {
      if (err.message?.includes('JSON') || err.message?.includes('Unexpected token') || err.message?.includes('Failed to fetch')) {
        console.warn('Network or JSON parse error calling /api/create-staff, executing fallback:', err);
        return await this.createStaffFallback(payload);
      }
      throw new Error(err.message || 'Error creating staff account.');
    }
  },

  async createStaffFallback(payload: any): Promise<{ success: boolean; message?: string; staff?: StaffUser }> {
    // 1. Try Supabase direct client if configured
    if (supabase) {
      try {
        const cleanEmail = (payload.email || payload.username || '').trim().toLowerCase();
        const fullName = (payload.fullName || payload.name || '').trim();
        const staffCode = `HAT-${String(Math.floor(1000 + Math.random() * 9000))}`;
        const newStaffRecord = {
          id: `staff-${Date.now()}`,
          staff_code: staffCode,
          full_name: fullName,
          email: cleanEmail,
          phone: (payload.phone || '').trim(),
          designation: (payload.designation || '').trim(),
          department: (payload.department || '').trim(),
          role: (payload.role || 'staff').toLowerCase() === 'admin' ? 'admin' : 'staff',
          status: (payload.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active',
          joining_date: payload.joiningDate || null,
          address: (payload.address || '').trim(),
          emergency_contact_name: (payload.emergencyContactName || '').trim(),
          emergency_contact_phone: (payload.emergencyContactPhone || '').trim(),
          notes: (payload.notes || '').trim(),
          profile_photo_url: payload.profilePhotoUrl || null,
        };

        const { data, error } = await db('staff').insert([newStaffRecord]).select('*').single();
        if (!error && data) {
          const formattedStaff: StaffUser = {
            id: data.id,
            staff_code: data.staff_code || staffCode,
            full_name: data.full_name || fullName,
            name: data.full_name || fullName,
            email: data.email,
            phone: data.phone || '',
            role: (data.role === 'admin' || data.role === 'Admin') ? 'admin' : 'staff',
            active: data.status === 'active' && data.active !== false,
            status: data.status === 'inactive' ? 'inactive' : 'active',
            designation: data.designation || '',
            department: data.department || '',
            joining_date: data.joining_date || '',
            address: data.address || '',
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_contact_phone: data.emergency_contact_phone || '',
            profile_photo_url: data.profile_photo_url || '',
            notes: data.notes || '',
            created_at: data.created_at,
            updated_at: data.updated_at
          };
          return { success: true, message: 'Staff account created successfully in Supabase.', staff: formattedStaff };
        }
      } catch (spErr) {
        console.warn('Direct Supabase insert failed, falling back to local DB:', spErr);
      }
    }

    // 2. Local DB execution fallback
    const localRes = await api.createStaff({
      name: payload.fullName || payload.name,
      username: payload.email || payload.username,
      email: payload.email,
      phone: payload.phone,
      role: payload.role,
      password: payload.password || 'staff123'
    });

    return {
      success: true,
      message: 'Staff account created successfully.',
      staff: localRes
    };
  },

  async updateStaff(id: string, payload: Partial<StaffUser>): Promise<StaffUser> {
    const targetStatus = payload.status || (payload.active === false ? 'inactive' : (payload.active === true ? 'active' : undefined));

    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString()
    };
    if (payload.full_name) updateData.full_name = payload.full_name;
    if (targetStatus) {
      updateData.status = targetStatus;
      updateData.active = targetStatus === 'active';
    }

    if (supabase) {
      try {
        const { data, error } = await db('staff')
          .update(updateData)
          .eq('id', id)
          .select('*')
          .single();

        if (!error && data) {
          return {
            ...data,
            full_name: data.full_name || data.name,
            name: data.full_name || data.name,
            role: (data.role === 'admin' || data.role === 'Admin') ? 'admin' : 'staff',
            active: data.status === 'active' && data.active !== false,
            status: (data.status === 'inactive' || data.active === false) ? 'inactive' : 'active'
          } as StaffUser;
        }
      } catch {
        // Fallback
      }
    }

    return {
      id,
      ...payload,
      status: targetStatus || payload.status || 'active',
      active: targetStatus ? targetStatus === 'active' : true
    } as StaffUser;
  },

  async toggleStaffStatus(id: string, currentStatus: string): Promise<StaffUser> {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return this.updateStaff(id, { status: newStatus as any, active: newStatus === 'active' });
  },

  async updateStaffOwnProfile(id: string, payload: { phone?: string; address?: string; emergency_contact_name?: string; emergency_contact_phone?: string; profile_photo_url?: string }): Promise<StaffUser> {
    return this.updateStaff(id, payload);
  },

  // Backwards compatibility methods
  async getAgents(): Promise<any[]> {
    return this.getStaff();
  },
  async createAgent(data: any): Promise<any> {
    return this.createStaff(data);
  },
  async updateAgent(id: string, data: any): Promise<any> {
    return this.updateStaff(id, data);
  },
  async deleteAgent(id: string): Promise<any> {
    return this.toggleStaffStatus(id, 'active');
  },

  // =========================================================================
  // 2. CUSTOMERS
  // =========================================================================
  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await db('customers')
          .select('*, agents(agent_id, full_name)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((c: any) => ({
            ...c,
            agent_code: c.agents?.agent_id || 'N/A',
            agent_name: c.agents?.full_name || 'Unassigned'
          })) as Customer[];
        }
      } catch {
        // Fallback
      }
    }
    return getLocalItems<Customer>('customers', SEED_CUSTOMERS).filter(c => !c.deleted_at);
  },

  async createCustomer(custData: Partial<Customer>): Promise<Customer> {
    const newCustObj: Customer = {
      id: `cust-${Date.now()}`,
      name: custData.name || 'New Customer',
      mobile_number: custData.mobile_number || '',
      email: custData.email || '',
      address: custData.address || '',
      passport_number: custData.passport_number || '',
      agent_id: custData.agent_id || null,
      agent_code: custData.agent_code || 'N/A',
      agent_name: custData.agent_name || 'Unassigned',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const newCustomer = {
          name: custData.name,
          mobile_number: custData.mobile_number,
          email: custData.email || null,
          address: custData.address || null,
          passport_number: custData.passport_number || null,
          agent_id: custData.agent_id || null,
          created_at: new Date().toISOString()
        };

        const { data, error } = await db('customers')
          .insert([newCustomer])
          .select('*, agents(agent_id, full_name)')
          .single();

        if (!error && data) {
          return {
            ...(data as any),
            agent_code: (data as any)?.agents?.agent_id || 'N/A',
            agent_name: (data as any)?.agents?.full_name || 'Unassigned'
          } as Customer;
        }
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Customer>('customers', SEED_CUSTOMERS);
    items.unshift(newCustObj);
    saveLocalItems('customers', items);
    return newCustObj;
  },

  async updateCustomer(id: string, custData: Partial<Customer>): Promise<Customer> {
    if (isSupabaseConfigured) {
      try {
        const updatePayload = {
          ...custData,
          updated_at: new Date().toISOString()
        };

        delete (updatePayload as any).agent_code;
        delete (updatePayload as any).agent_name;
        delete (updatePayload as any).agents;

        const { data, error } = await db('customers')
          .update(updatePayload)
          .eq('id', id)
          .select('*, agents(agent_id, full_name)')
          .single();

        if (!error && data) {
          return {
            ...(data as any),
            agent_code: (data as any)?.agents?.agent_id || 'N/A',
            agent_name: (data as any)?.agents?.full_name || 'Unassigned'
          } as Customer;
        }
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Customer>('customers', SEED_CUSTOMERS);
    const idx = items.findIndex(c => c.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...custData, updated_at: new Date().toISOString() };
      saveLocalItems('customers', items);
      return items[idx];
    }
    return { id, ...custData } as Customer;
  },

  async deleteCustomer(id: string, deleteReason: string, deletedBy: string = 'admin'): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await db('customers')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
            delete_reason: deleteReason
          })
          .eq('id', id);

        if (!error) return;
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Customer>('customers', SEED_CUSTOMERS);
    const idx = items.findIndex(c => c.id === id);
    if (idx !== -1) {
      items[idx].deleted_at = new Date().toISOString();
      items[idx].deleted_by = deletedBy;
      items[idx].delete_reason = deleteReason;
      saveLocalItems('customers', items);

      const delRecords = getLocalItems<DeletedRecord>('deleted_records', []);
      delRecords.unshift({
        id: `del-${Date.now()}`,
        table_name: 'customers',
        record_title: items[idx].name,
        record_subtitle: items[idx].mobile_number,
        assigned_agent_name: items[idx].agent_name,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        delete_reason: deleteReason,
        original_data: items[idx]
      });
      saveLocalItems('deleted_records', delRecords);
    }
  },

  // =========================================================================
  // 3. ENQUIRIES
  // =========================================================================
  async getEnquiries(): Promise<Enquiry[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await db('enquiries')
          .select('*, agents(agent_id, full_name)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((e: any) => ({
            ...e,
            agent_code: e.agents?.agent_id || 'N/A',
            agent_name: e.agents?.full_name || 'Unassigned'
          })) as Enquiry[];
        }
      } catch {
        // Fallback
      }
    }
    return getLocalItems<Enquiry>('enquiries', SEED_ENQUIRIES).filter(e => !e.deleted_at);
  },

  async createEnquiry(enquiryData: Partial<Enquiry>): Promise<Enquiry> {
    const newEnqObj: Enquiry = {
      id: `enq-${Date.now()}`,
      customer_name: enquiryData.customer_name || 'New Customer',
      mobile_number: enquiryData.mobile_number || '',
      service_type: enquiryData.service_type || 'Flight Booking',
      description: enquiryData.description || '',
      status: enquiryData.status || 'New',
      expected_date: enquiryData.expected_date || '',
      agent_id: enquiryData.agent_id || null,
      agent_code: enquiryData.agent_code || 'N/A',
      agent_name: enquiryData.agent_name || 'Unassigned',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const newEnquiry = {
          customer_name: enquiryData.customer_name,
          mobile_number: enquiryData.mobile_number,
          service_type: enquiryData.service_type || 'Flight Booking',
          description: enquiryData.description || '',
          status: enquiryData.status || 'New',
          expected_date: enquiryData.expected_date || null,
          agent_id: enquiryData.agent_id || null,
          created_at: new Date().toISOString()
        };

        const { data, error } = await db('enquiries')
          .insert([newEnquiry])
          .select('*, agents(agent_id, full_name)')
          .single();

        if (!error && data) {
          return {
            ...(data as any),
            agent_code: (data as any)?.agents?.agent_id || 'N/A',
            agent_name: (data as any)?.agents?.full_name || 'Unassigned'
          } as Enquiry;
        }
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Enquiry>('enquiries', SEED_ENQUIRIES);
    items.unshift(newEnqObj);
    saveLocalItems('enquiries', items);
    return newEnqObj;
  },

  async updateEnquiry(id: string, enquiryData: Partial<Enquiry>): Promise<Enquiry> {
    if (isSupabaseConfigured) {
      try {
        const updatePayload = {
          ...enquiryData,
          updated_at: new Date().toISOString()
        };

        delete (updatePayload as any).agent_code;
        delete (updatePayload as any).agent_name;
        delete (updatePayload as any).agents;

        const { data, error } = await db('enquiries')
          .update(updatePayload)
          .eq('id', id)
          .select('*, agents(agent_id, full_name)')
          .single();

        if (!error && data) {
          return {
            ...(data as any),
            agent_code: (data as any)?.agents?.agent_id || 'N/A',
            agent_name: (data as any)?.agents?.full_name || 'Unassigned'
          } as Enquiry;
        }
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Enquiry>('enquiries', SEED_ENQUIRIES);
    const idx = items.findIndex(e => e.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...enquiryData, updated_at: new Date().toISOString() };
      saveLocalItems('enquiries', items);
      return items[idx];
    }
    return { id, ...enquiryData } as Enquiry;
  },

  async deleteEnquiry(id: string, deleteReason: string, deletedBy: string = 'admin'): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await db('enquiries')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
            delete_reason: deleteReason
          })
          .eq('id', id);

        if (!error) return;
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Enquiry>('enquiries', SEED_ENQUIRIES);
    const idx = items.findIndex(e => e.id === id);
    if (idx !== -1) {
      items[idx].deleted_at = new Date().toISOString();
      items[idx].deleted_by = deletedBy;
      items[idx].delete_reason = deleteReason;
      saveLocalItems('enquiries', items);

      const delRecords = getLocalItems<DeletedRecord>('deleted_records', []);
      delRecords.unshift({
        id: `del-${Date.now()}`,
        table_name: 'enquiries',
        record_title: items[idx].customer_name,
        record_subtitle: items[idx].service_type,
        assigned_agent_name: items[idx].agent_name,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        delete_reason: deleteReason,
        original_data: items[idx]
      });
      saveLocalItems('deleted_records', delRecords);
    }
  },

  // =========================================================================
  // 5. EXPENSES
  // =========================================================================
  async getExpenses(): Promise<Expense[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await db('expenses')
          .select('*, agents(agent_id, full_name)')
          .is('deleted_at', null)
          .order('date', { ascending: false });

        if (!error && data) {
          return data.map((e: any) => ({
            ...e,
            agent_code: e.agents?.agent_id || 'N/A',
            agent_name: e.agents?.full_name || 'Unassigned'
          })) as Expense[];
        }
      } catch {
        // Fallback
      }
    }
    return getLocalItems<Expense>('expenses', SEED_EXPENSES).filter(e => !e.deleted_at);
  },

  async createExpense(expData: Partial<Expense>): Promise<Expense> {
    const newExpObj: Expense = {
      id: `exp-${Date.now()}`,
      category: expData.category || 'General',
      description: expData.description || 'Expense',
      amount: expData.amount || 0,
      date: expData.date || new Date().toISOString().split('T')[0],
      payment_mode: expData.payment_mode || 'Cash',
      agent_id: expData.agent_id || null,
      agent_code: expData.agent_code || 'N/A',
      agent_name: expData.agent_name || 'Unassigned',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const newExpense = {
          category: expData.category || 'General',
          description: expData.description || 'Expense',
          amount: expData.amount || 0,
          date: expData.date || new Date().toISOString().split('T')[0],
          payment_mode: expData.payment_mode || 'Cash',
          agent_id: expData.agent_id || null,
          created_at: new Date().toISOString()
        };

        const { data, error } = await db('expenses')
          .insert([newExpense])
          .select('*, agents(agent_id, full_name)')
          .single();

        if (!error && data) {
          return {
            ...(data as any),
            agent_code: (data as any)?.agents?.agent_id || 'N/A',
            agent_name: (data as any)?.agents?.full_name || 'Unassigned'
          } as Expense;
        }
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Expense>('expenses', SEED_EXPENSES);
    items.unshift(newExpObj);
    saveLocalItems('expenses', items);
    return newExpObj;
  },

  async updateExpense(id: string, expData: Partial<Expense>): Promise<Expense> {
    if (isSupabaseConfigured) {
      try {
        const updatePayload = {
          ...expData,
          updated_at: new Date().toISOString()
        };

        delete (updatePayload as any).agent_code;
        delete (updatePayload as any).agent_name;
        delete (updatePayload as any).agents;

        const { data, error } = await db('expenses')
          .update(updatePayload)
          .eq('id', id)
          .select('*, agents(agent_id, full_name)')
          .single();

        if (!error && data) {
          return {
            ...(data as any),
            agent_code: (data as any)?.agents?.agent_id || 'N/A',
            agent_name: (data as any)?.agents?.full_name || 'Unassigned'
          } as Expense;
        }
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Expense>('expenses', SEED_EXPENSES);
    const idx = items.findIndex(e => e.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...expData, updated_at: new Date().toISOString() };
      saveLocalItems('expenses', items);
      return items[idx];
    }
    return { id, ...expData } as Expense;
  },

  async deleteExpense(id: string, deleteReason: string, deletedBy: string = 'admin'): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await db('expenses')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
            delete_reason: deleteReason
          })
          .eq('id', id);

        if (!error) return;
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<Expense>('expenses', SEED_EXPENSES);
    const idx = items.findIndex(e => e.id === id);
    if (idx !== -1) {
      items[idx].deleted_at = new Date().toISOString();
      items[idx].deleted_by = deletedBy;
      items[idx].delete_reason = deleteReason;
      saveLocalItems('expenses', items);

      const delRecords = getLocalItems<DeletedRecord>('deleted_records', []);
      delRecords.unshift({
        id: `del-${Date.now()}`,
        table_name: 'expenses',
        record_title: items[idx].description || items[idx].category,
        record_subtitle: `₹${items[idx].amount}`,
        assigned_agent_name: items[idx].agent_name,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        delete_reason: deleteReason,
        original_data: items[idx]
      });
      saveLocalItems('deleted_records', delRecords);
    }
  },

  // =========================================================================
  // 6. FOLLOW-UPS
  // =========================================================================
  async getFollowUps(): Promise<FollowUp[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await db('follow_ups')
          .select('*, agents(agent_id, full_name)')
          .is('deleted_at', null)
          .order('scheduled_at', { ascending: true });

        if (!error && data) {
          return data.map((f: any) => ({
            ...f,
            agent_code: f.agents?.agent_id || 'N/A',
            agent_name: f.agents?.full_name || 'Unassigned'
          })) as FollowUp[];
        }
      } catch {
        // Fallback
      }
    }
    return getLocalItems<FollowUp>('follow_ups', SEED_FOLLOWUPS).filter(f => !f.deleted_at);
  },

  async createFollowUp(fuData: Partial<FollowUp>): Promise<FollowUp> {
    const newFuObj: FollowUp = {
      id: `fup-${Date.now()}`,
      customer_name: fuData.customer_name || 'Customer',
      mobile_number: fuData.mobile_number || '',
      title: fuData.title || 'Follow up call',
      notes: fuData.notes || '',
      scheduled_at: fuData.scheduled_at || new Date().toISOString(),
      status: fuData.status || 'Pending',
      booking_id: fuData.booking_id || null,
      enquiry_id: fuData.enquiry_id || null,
      agent_id: fuData.agent_id || null,
      agent_code: fuData.agent_code || 'N/A',
      agent_name: fuData.agent_name || 'Unassigned',
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const newFollowUp = {
          customer_name: fuData.customer_name,
          mobile_number: fuData.mobile_number,
          title: fuData.title || 'Follow up call',
          notes: fuData.notes || '',
          scheduled_at: fuData.scheduled_at,
          status: fuData.status || 'Pending',
          booking_id: fuData.booking_id || null,
          enquiry_id: fuData.enquiry_id || null,
          agent_id: fuData.agent_id || null,
          created_at: new Date().toISOString()
        };

        const { data, error } = await db('follow_ups')
          .insert([newFollowUp])
          .select('*, agents(agent_id, full_name)')
          .single();

        if (!error && data) {
          return {
            ...(data as any),
            agent_code: (data as any)?.agents?.agent_id || 'N/A',
            agent_name: (data as any)?.agents?.full_name || 'Unassigned'
          } as FollowUp;
        }
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<FollowUp>('follow_ups', SEED_FOLLOWUPS);
    items.unshift(newFuObj);
    saveLocalItems('follow_ups', items);
    return newFuObj;
  },

  async updateFollowUp(id: string, fuData: Partial<FollowUp>): Promise<FollowUp> {
    if (isSupabaseConfigured) {
      try {
        const updatePayload = {
          ...fuData,
          updated_at: new Date().toISOString()
        };

        delete (updatePayload as any).agent_code;
        delete (updatePayload as any).agent_name;
        delete (updatePayload as any).agents;

        const { data, error } = await db('follow_ups')
          .update(updatePayload)
          .eq('id', id)
          .select('*, agents(agent_id, full_name)')
          .single();

        if (!error && data) {
          return {
            ...(data as any),
            agent_code: (data as any)?.agents?.agent_id || 'N/A',
            agent_name: (data as any)?.agents?.full_name || 'Unassigned'
          } as FollowUp;
        }
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<FollowUp>('follow_ups', SEED_FOLLOWUPS);
    const idx = items.findIndex(f => f.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...fuData, updated_at: new Date().toISOString() };
      saveLocalItems('follow_ups', items);
      return items[idx];
    }
    return { id, ...fuData } as FollowUp;
  },

  async deleteFollowUp(id: string, deleteReason: string, deletedBy: string = 'admin'): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await db('follow_ups')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: deletedBy,
            delete_reason: deleteReason
          })
          .eq('id', id);

        if (!error) return;
      } catch {
        // Fallback
      }
    }

    const items = getLocalItems<FollowUp>('follow_ups', SEED_FOLLOWUPS);
    const idx = items.findIndex(f => f.id === id);
    if (idx !== -1) {
      items[idx].deleted_at = new Date().toISOString();
      items[idx].deleted_by = deletedBy;
      items[idx].delete_reason = deleteReason;
      saveLocalItems('follow_ups', items);

      const delRecords = getLocalItems<DeletedRecord>('deleted_records', []);
      delRecords.unshift({
        id: `del-${Date.now()}`,
        table_name: 'follow_ups',
        record_title: items[idx].title || items[idx].customer_name,
        record_subtitle: items[idx].mobile_number,
        assigned_agent_name: items[idx].agent_name,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        delete_reason: deleteReason,
        original_data: items[idx]
      });
      saveLocalItems('deleted_records', delRecords);
    }
  },

  // =========================================================================
  // 7. ADMIN DELETED RECORDS AUDIT & RESTORE
  // =========================================================================
  async getDeletedRecords(): Promise<DeletedRecord[]> {
    if (isSupabaseConfigured) {
      const tables: ("agents" | "customers" | "enquiries" | "bookings" | "expenses" | "follow_ups")[] = ['agents', 'customers', 'enquiries', 'bookings', 'expenses', 'follow_ups'];
      const results: DeletedRecord[] = [];

      for (const tbl of tables) {
        try {
          const { data, error } = await db(tbl as any)
            .select('*, agents(full_name, agent_id)')
            .not('deleted_at', 'is', null)
            .order('deleted_at', { ascending: false });

          if (!error && data) {
            data.forEach((item: any) => {
              let title = item.full_name || item.name || item.customer_name || item.title || item.description || `Record #${item.id}`;
              let subtitle = item.email || item.mobile_number || item.category || item.booking_type || '';

              results.push({
                id: item.id,
                table_name: tbl,
                record_title: title,
                record_subtitle: subtitle,
                deleted_at: item.deleted_at,
                deleted_by: item.deleted_by || 'Admin',
                delete_reason: item.delete_reason || 'No reason provided',
                assigned_agent_name: item.agents?.full_name || 'Unassigned'
              });
            });
          }
        } catch {
          // Continue
        }
      }

      if (results.length > 0) {
        results.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
        return results;
      }
    }

    return getLocalItems<DeletedRecord>('deleted_records', []);
  },

  async restoreRecord(tableName: string, id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await db(tableName)
          .update({
            deleted_at: null,
            deleted_by: null,
            delete_reason: null
          })
          .eq('id', id);

        if (!error) return;
      } catch {
        // Fallback
      }
    }

    // Restore locally if found
    if (tableName === 'customers' || tableName === 'enquiries' || tableName === 'expenses' || tableName === 'follow_ups') {
      const items = getLocalItems<any>(tableName, []);
      const item = items.find(i => i.id === id);
      if (item) {
        item.deleted_at = null;
        item.deleted_by = null;
        item.delete_reason = null;
        saveLocalItems(tableName, items);
      }
    }

    const delRecords = getLocalItems<DeletedRecord>('deleted_records', []);
    const updatedDel = delRecords.filter(d => d.id !== id && d.original_data?.id !== id);
    saveLocalItems('deleted_records', updatedDel);
  },

  async permanentDeleteRecord(tableName: string, id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await db(tableName)
          .delete()
          .eq('id', id);

        if (!error) return;
      } catch {
        // Fallback
      }
    }

    if (tableName === 'customers' || tableName === 'enquiries' || tableName === 'expenses' || tableName === 'follow_ups') {
      const items = getLocalItems<any>(tableName, []);
      const filtered = items.filter(i => i.id !== id);
      saveLocalItems(tableName, filtered);
    }

    const delRecords = getLocalItems<DeletedRecord>('deleted_records', []);
    const updatedDel = delRecords.filter(d => d.id !== id && d.original_data?.id !== id);
    saveLocalItems('deleted_records', updatedDel);
  },

  // =========================================================================
  // 8. STAFF TASK DASHBOARD & ACTIVITY LOGS
  // =========================================================================
  async getTasksForStaff(staffInput: StaffUser | string): Promise<GeneralTask[]> {
    const staffObj: Partial<StaffUser> = typeof staffInput === 'object' ? staffInput : { id: staffInput };
    
    const identifiers = new Set<string>();
    [
      staffObj.id,
      staffObj.staff_code,
      staffObj.email,
      staffObj.username,
      staffObj.name,
      staffObj.full_name
    ].forEach(val => {
      if (val) identifiers.add(String(val).trim().toLowerCase());
    });

    const isAssigned = (assignedVal: any) => {
      if (!assignedVal) return false;
      return identifiers.has(String(assignedVal).trim().toLowerCase());
    };

    const tasksMap = new Map<string, GeneralTask>();

    // 1. Fetch from Local Express API (Tickets, Passports, General Tasks)
    try {
      const [tickets, passports, generalTasks] = await Promise.all([
        api.getTickets().catch(() => []),
        api.getPassports().catch(() => []),
        api.getGeneralTasks().catch(() => [])
      ]);

      for (const t of tickets) {
        if (isAssigned(t.assignedStaffId) || isAssigned((t as any).assigned_staff_id)) {
          const routeStr = (t.departureAirport || t.arrivalAirport) ? ` (${t.departureAirport || ''} → ${t.arrivalAirport || ''})` : '';
          const taskObj: GeneralTask = {
            id: t.id,
            type: 'ticket' as any,
            title: `Flight Ticket (${t.pnr || 'No PNR'}): ${t.customerName || 'Passenger'}${routeStr}`,
            description: `Airline: ${t.airline || 'N/A'}, Flight: ${t.flightNumber || 'N/A'}, Travel Date: ${t.departureDate || 'N/A'}, Departure: ${t.departureTime || 'N/A'}`,
            status: t.ticketStatus || 'Pending',
            assignedStaffId: t.assignedStaffId,
            assigned_staff_id: t.assignedStaffId,
            adminNote: t.notes?.[0]?.text || '',
            staffUpdateNote: '',
            dueDate: t.departureDate || '',
            customerName: t.customerName || '',
            mobileNumber: t.mobileNumber || '',
            serviceType: 'Flight Ticket',
            totalAmount: t.totalAmount || 0,
            amountPaid: t.amountPaid || 0,
            balanceDue: t.balanceDue || 0,
            paymentStatus: t.paymentStatus || 'Unpaid',
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: t.updatedAt || new Date().toISOString()
          };
          tasksMap.set(taskObj.id, taskObj);
        }
      }

      for (const p of passports) {
        if (isAssigned(p.assignedStaffId) || isAssigned((p as any).assigned_staff_id)) {
          const taskObj: GeneralTask = {
            id: p.id,
            type: 'passport' as any,
            title: `Passport Process (${p.serviceType || 'Fresh'}): ${p.applicantName || 'Applicant'}`,
            description: `App No: ${p.applicationNumber || 'N/A'}, PSK: ${p.passportSevaKendra || 'N/A'}, Appointment Date: ${p.appointmentDate || 'N/A'} ${p.appointmentTime || ''}`,
            status: p.passportStatus || 'Pending',
            assignedStaffId: p.assignedStaffId,
            assigned_staff_id: p.assignedStaffId,
            adminNote: p.notes?.[0]?.text || '',
            staffUpdateNote: '',
            dueDate: p.appointmentDate || '',
            customerName: p.applicantName || '',
            mobileNumber: p.mobileNumber || '',
            serviceType: `Passport (${p.serviceType || 'Fresh'})`,
            totalAmount: p.totalAmount || 0,
            amountPaid: p.amountPaid || 0,
            balanceDue: p.balanceDue || 0,
            paymentStatus: p.paymentStatus || 'Unpaid',
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString()
          };
          tasksMap.set(taskObj.id, taskObj);
        }
      }

      for (const g of generalTasks) {
        if (isAssigned(g.assignedStaffId) || isAssigned((g as any).assigned_staff_id)) {
          const taskObj: GeneralTask = {
            id: g.id,
            type: 'general',
            title: g.title || `${g.serviceType || 'Service Task'} for ${g.customerName || 'Customer'}`,
            description: g.description || '',
            status: g.status || 'Pending',
            assignedStaffId: g.assignedStaffId || (g as any).assigned_staff_id,
            assigned_staff_id: g.assignedStaffId || (g as any).assigned_staff_id,
            adminNote: g.adminNote || (g as any).admin_note || '',
            staffUpdateNote: g.staffUpdateNote || (g as any).staff_update_note || '',
            dueDate: g.dueDate || (g as any).due_date || '',
            customerName: g.customerName || (g as any).customer_name || '',
            mobileNumber: g.mobileNumber || (g as any).mobile_number || '',
            serviceType: g.serviceType || (g as any).service_type || 'General',
            totalAmount: g.totalAmount || (g as any).total_amount || 0,
            amountPaid: g.amountPaid || (g as any).amount_paid || 0,
            balanceDue: g.balanceDue || (g as any).balance_due || 0,
            paymentStatus: g.paymentStatus || (g as any).payment_status || 'Unpaid',
            createdAt: g.createdAt || (g as any).created_at || new Date().toISOString(),
            updatedAt: g.updatedAt || (g as any).updated_at || new Date().toISOString(),
            completedAt: g.completedAt || (g as any).completed_at || undefined
          };
          tasksMap.set(taskObj.id, taskObj);
        }
      }

      // 1b. Also include assigned Follow-ups for staff
      try {
        const followUps = await this.getFollowUps().catch(() => []);
        for (const f of followUps) {
          if (isAssigned(f.agent_id) || isAssigned(f.agent_code) || isAssigned(f.agent_name)) {
            const taskObj: GeneralTask = {
              id: f.id,
              type: 'general',
              title: `Follow-up Call: ${f.title}`,
              description: f.notes ? `Notes: ${f.notes}` : `Follow-up call with ${f.customer_name} (${f.mobile_number})`,
              status: f.status === 'Completed' ? 'Completed' : (f.status === 'Cancelled' ? 'On Hold' : 'Pending'),
              assignedStaffId: f.agent_id || undefined,
              assigned_staff_id: f.agent_id || undefined,
              adminNote: f.notes || '',
              staffUpdateNote: '',
              dueDate: f.scheduled_at ? f.scheduled_at.slice(0, 10) : '',
              customerName: f.customer_name,
              mobileNumber: f.mobile_number,
              serviceType: 'Follow-up Call',
              totalAmount: 0,
              amountPaid: 0,
              balanceDue: 0,
              paymentStatus: 'Unpaid',
              createdAt: f.created_at || new Date().toISOString(),
              updatedAt: f.updated_at || f.created_at || new Date().toISOString()
            };
            tasksMap.set(f.id, taskObj);
          }
        }
      } catch (fErr) {
        console.warn('Follow-ups task fetch warning:', fErr);
      }
    } catch (err) {
      console.warn('Local API tasks fetch warning:', err);
    }

    // 2. Fetch from Supabase (if configured)
    if (supabase) {
      try {
        const { data: sbGeneral } = await db('general_tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (sbGeneral) {
          sbGeneral.forEach((t: any) => {
            if (isAssigned(t.assigned_staff_id) || isAssigned(t.assignedStaffId)) {
              const taskObj: GeneralTask = {
                id: t.id,
                type: 'general',
                title: t.title || `${t.service_type || 'Task'} for ${t.customer_name || 'Customer'}`,
                description: t.description || '',
                status: t.status || 'Pending',
                assignedStaffId: t.assigned_staff_id,
                assigned_staff_id: t.assigned_staff_id,
                adminNote: t.admin_note || '',
                admin_note: t.admin_note || '',
                staffUpdateNote: t.staff_update_note || '',
                staff_update_note: t.staff_update_note || '',
                dueDate: t.due_date || '',
                due_date: t.due_date || '',
                customerName: t.customer_name || '',
                mobileNumber: t.mobile_number || '',
                serviceType: t.service_type || 'General',
                totalAmount: t.total_amount || 0,
                amountPaid: t.amount_paid || 0,
                balanceDue: t.balance_due || 0,
                paymentStatus: t.payment_status || 'Unpaid',
                createdAt: t.created_at || new Date().toISOString(),
                updatedAt: t.updated_at || new Date().toISOString(),
                completedAt: t.completed_at || undefined,
              };
              tasksMap.set(taskObj.id, taskObj);
            }
          });
        }
      } catch (e) {
        console.warn('Supabase general tasks query warning:', e);
      }
    }

    return Array.from(tasksMap.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  },

  
  async getGeneralTasks(): Promise<GeneralTask[]> {
    const tasksMap = new Map<string, GeneralTask>();
    
    try {
      const localTasks = await api.getGeneralTasks().catch(() => []);
      for (const g of localTasks) {
        tasksMap.set(g.id, g);
      }
    } catch (err) {
      console.warn('Local general tasks fetch warning:', err);
    }
    
    if (supabase) {
      try {
        const { data: sbGeneral } = await db('general_tasks')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (sbGeneral) {
          sbGeneral.forEach((t: any) => {
            const taskObj: GeneralTask = {
              id: t.id,
              type: 'general',
              title: t.title || `${t.service_type || 'Task'} for ${t.customer_name || 'Customer'}`,
              description: t.description || '',
              status: t.status || 'Pending',
              assignedStaffId: t.assigned_staff_id,
              assigned_staff_id: t.assigned_staff_id,
              adminNote: t.admin_note || '',
              admin_note: t.admin_note || '',
              staffUpdateNote: t.staff_update_note || '',
              staff_update_note: t.staff_update_note || '',
              dueDate: t.due_date || '',
              due_date: t.due_date || '',
              customerName: t.customer_name || '',
              mobileNumber: t.mobile_number || '',
              serviceType: t.service_type || 'General',
              totalAmount: t.total_amount || 0,
              amountPaid: t.amount_paid || 0,
              balanceDue: t.balance_due || 0,
              paymentStatus: t.payment_status || 'Unpaid',
              createdAt: t.created_at || new Date().toISOString(),
              updatedAt: t.updated_at || new Date().toISOString(),
              completedAt: t.completed_at || undefined,
            };
            tasksMap.set(taskObj.id, taskObj);
          });
        }
      } catch (e) {
        console.warn('Supabase general tasks query warning:', e);
      }
    }
    
    return Array.from(tasksMap.values()).sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  },

  async createStaffTask(taskData: {
    title: string;
    customerName: string;
    mobileNumber: string;
    serviceType: string;
    description?: string;
    dueDate?: string;
    totalAmount?: number;
    assignedStaffId: string;
    assignedStaffName: string;
    noteText?: string;
  }): Promise<GeneralTask> {
    const createdTask = await api.createGeneralTask({
      title: taskData.title,
      customerName: taskData.customerName,
      mobileNumber: taskData.mobileNumber,
      serviceType: taskData.serviceType,
      description: taskData.description || '',
      status: 'Pending',
      assignedStaffId: taskData.assignedStaffId,
      dueDate: taskData.dueDate,
      totalAmount: taskData.totalAmount || 0,
      noteText: taskData.noteText
    });

    if (supabase) {
      try {
        await db('general_tasks').insert([{
          id: createdTask.id,
          title: createdTask.title || `${taskData.serviceType} for ${taskData.customerName}`,
          customer_name: taskData.customerName,
          mobile_number: taskData.mobileNumber,
          service_type: taskData.serviceType,
          description: taskData.description || '',
          status: 'Pending',
          assigned_staff_id: taskData.assignedStaffId,
          due_date: taskData.dueDate || null,
          total_amount: taskData.totalAmount || 0,
          amount_paid: 0,
          balance_due: taskData.totalAmount || 0,
          payment_status: 'Unpaid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

        await db('activity_logs').insert([{
          staff_id: taskData.assignedStaffId,
          staff_name: taskData.assignedStaffName,
          task_id: createdTask.id,
          task_title: createdTask.title || 'New Task',
          action: 'CREATE_TASK',
          old_status: '-',
          new_status: 'Pending',
          note: taskData.noteText || 'Task manually created by staff',
          created_at: new Date().toISOString()
        }]);
      } catch (err) {
        console.warn('Supabase task create sync error:', err);
      }
    }

    return createdTask;
  },

  async updateStaffTaskStatus(
    taskId: string,
    staffId: string,
    staffName: string,
    newStatus: string,
    updateNote: string,
    taskTitle?: string,
    oldStatus?: string,
    financials?: {
      totalAmount?: number;
      amountPaid?: number;
      paymentStatus?: string;
    }
  ): Promise<GeneralTask> {
    const nowIso = new Date().toISOString();

    const finPayload: any = {};
    if (financials) {
      if (financials.totalAmount !== undefined) finPayload.totalAmount = financials.totalAmount;
      if (financials.amountPaid !== undefined) finPayload.amountPaid = financials.amountPaid;
      if (financials.paymentStatus !== undefined) finPayload.paymentStatus = financials.paymentStatus;
      if (financials.totalAmount !== undefined && financials.amountPaid !== undefined) {
        finPayload.balanceDue = Math.max(0, financials.totalAmount - financials.amountPaid);
      }
    }

    // 1. Update in local/Express API based on task ID prefix
    if (taskId.startsWith('tkt-')) {
      try {
        await api.updateTicket(taskId, { ticketStatus: newStatus as any, ...finPayload });
        if (updateNote && updateNote.trim()) {
          await api.addTicketNote(taskId, updateNote);
        }
      } catch (e) {
        console.warn('Local ticket status update warning:', e);
      }
    } else if (taskId.startsWith('pass-')) {
      try {
        await api.updatePassport(taskId, { passportStatus: newStatus as any, ...finPayload });
        if (updateNote && updateNote.trim()) {
          await api.addPassportNote(taskId, updateNote);
        }
      } catch (e) {
        console.warn('Local passport status update warning:', e);
      }
    } else if (taskId.startsWith('fup-')) {
      try {
        const fuStatus = (newStatus === 'Completed' || newStatus === 'Ready / Completed') ? 'Completed' : (newStatus === 'On Hold' || newStatus === 'Cancelled' ? 'Cancelled' : 'Pending');
        await this.updateFollowUp(taskId, { status: fuStatus, notes: updateNote });
      } catch (e) {
        console.warn('Local follow-up status update warning:', e);
      }
    } else {
      try {
        await api.updateGeneralTask(taskId, { status: newStatus as any, staffUpdateNote: updateNote, ...finPayload });
        if (updateNote && updateNote.trim()) {
          await api.addGeneralTaskNote(taskId, updateNote);
        }
      } catch (e) {
        console.warn('Local general task status update warning:', e);
      }
    }

    // 2. Update in Supabase (if configured)
    let updatedTaskFromSb: GeneralTask | null = null;
    if (supabase) {
      try {
        const isCompleted = newStatus === 'Completed' || newStatus === 'Ready / Completed';
        const updatePayload: any = {
          status: newStatus,
          staff_update_note: updateNote,
          updated_at: nowIso,
        };
        if (isCompleted) updatePayload.completed_at = nowIso;
        if (financials) {
          if (financials.totalAmount !== undefined) updatePayload.total_amount = financials.totalAmount;
          if (financials.amountPaid !== undefined) updatePayload.amount_paid = financials.amountPaid;
          if (financials.paymentStatus !== undefined) updatePayload.payment_status = financials.paymentStatus;
          if (financials.totalAmount !== undefined && financials.amountPaid !== undefined) {
            updatePayload.balance_due = Math.max(0, financials.totalAmount - financials.amountPaid);
          }
        }

        const { data } = await db('general_tasks')
          .update(updatePayload)
          .eq('id', taskId)
          .select('*')
          .single();

        if (data) {
          updatedTaskFromSb = {
            id: data.id,
            type: 'general',
            title: data.title || `${data.service_type || 'Task'} for ${data.customer_name || 'Customer'}`,
            description: data.description || '',
            status: data.status,
            assignedStaffId: data.assigned_staff_id,
            assigned_staff_id: data.assigned_staff_id,
            adminNote: data.admin_note || '',
            staffUpdateNote: data.staff_update_note || '',
            dueDate: data.due_date || '',
            customerName: data.customer_name || '',
            mobileNumber: data.mobile_number || '',
            serviceType: data.service_type || 'General',
            totalAmount: data.total_amount || 0,
            amountPaid: data.amount_paid || 0,
            balanceDue: data.balance_due || 0,
            paymentStatus: data.payment_status || 'Unpaid',
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            completedAt: data.completed_at,
          } as GeneralTask;
        }

        await db('activity_logs').insert([
          {
            staff_id: staffId,
            staff_name: staffName,
            task_id: taskId,
            task_title: taskTitle || 'Assigned Task',
            action: 'STATUS_UPDATE',
            old_status: oldStatus || 'Pending',
            new_status: newStatus,
            note: updateNote + (financials ? ` | Fee: ₹${financials.totalAmount ?? 0}, Paid: ₹${financials.amountPaid ?? 0}, Status: ${financials.paymentStatus ?? 'Unpaid'}` : ''),
            created_at: nowIso,
          },
        ]).catch(() => {});
      } catch (logErr) {
        console.warn('Supabase activity log/update error:', logErr);
      }
    }

    if (updatedTaskFromSb) {
      return updatedTaskFromSb;
    }

    return {
      id: taskId,
      title: taskTitle || 'Assigned Task',
      status: newStatus,
      staffUpdateNote: updateNote,
      totalAmount: financials?.totalAmount,
      amountPaid: financials?.amountPaid,
      balanceDue: (financials?.totalAmount !== undefined && financials?.amountPaid !== undefined)
        ? Math.max(0, financials.totalAmount - financials.amountPaid)
        : undefined,
      paymentStatus: financials?.paymentStatus,
      updatedAt: nowIso
    } as GeneralTask;
  },

  async getActivityLogs(): Promise<any[]> {
    if (!supabase) return [];

    try {
      const { data, error } = await db('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);

      if (error) {
        console.warn('Error fetching activity logs:', error);
        return [];
      }

      return data || [];
    } catch (e) {
      return [];
    }
  }
};
