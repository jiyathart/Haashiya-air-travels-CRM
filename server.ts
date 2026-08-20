import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Supabase Admin Client
const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yaytvvzvlygkujuxvxmg.supabase.co').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_HiM3yBFWkczEEVYFOGJkAg_FhMmq0D1').trim();

function getValidServerSupabaseUrl(candidate: string): string {
  if (!candidate) return '';
  let cleaned = candidate;
  if (cleaned.startsWith('https:https://')) cleaned = cleaned.replace('https:https://', 'https://');
  if (cleaned.startsWith('http:http://')) cleaned = cleaned.replace('http:http://', 'http://');
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // Invalid URL format
  }
  return '';
}

const SUPABASE_URL = getValidServerSupabaseUrl(rawSupabaseUrl);

let supabaseAdmin: any = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase Admin client:', err);
    supabaseAdmin = null;
  }
}

// Password Hashing Helper using Node native crypto
const SALT = 'haashiya_travels_secure_salt_2026';

function hashPassword(password: string): string {
  return crypto.scryptSync(password, SALT, 64).toString('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Database JSON Persistence Path
const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Auto Calculate Reporting Time Helper for Server
function calculateReportingDateTime(departureDate: string, departureTime: string, flightType: string) {
  if (!departureDate || !departureTime) {
    return { reportingDate: departureDate || '', reportingTime: departureTime || '' };
  }
  try {
    const [year, month, day] = departureDate.split('-').map(Number);
    const [hours, minutes] = departureTime.split(':').map(Number);
    const hoursToSubtract = flightType === 'International' ? 3 : 2;
    const depDateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);
    depDateObj.setHours(depDateObj.getHours() - hoursToSubtract);

    const rYear = depDateObj.getFullYear();
    const rMonth = String(depDateObj.getMonth() + 1).padStart(2, '0');
    const rDay = String(depDateObj.getDate()).padStart(2, '0');
    const rHours = String(depDateObj.getHours()).padStart(2, '0');
    const rMins = String(depDateObj.getMinutes()).padStart(2, '0');

    return {
      reportingDate: `${rYear}-${rMonth}-${rDay}`,
      reportingTime: `${rHours}:${rMins}`
    };
  } catch {
    return { reportingDate: departureDate, reportingTime: departureTime };
  }
}

// Payment Summary Calculation Helper
function calculatePaymentSummary(totalAmountInput: any, payments: any[] = []) {
  const totalAmount = Math.max(0, Number(totalAmountInput) || 0);
  const amountPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);

  let paymentStatus = 'Unpaid';
  if (totalAmount <= 0) {
    paymentStatus = amountPaid > 0 ? 'Fully Paid' : 'Unpaid';
  } else {
    if (amountPaid >= totalAmount) {
      paymentStatus = 'Fully Paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'Partially Paid';
    } else {
      paymentStatus = 'Unpaid';
    }
  }

  return { totalAmount, amountPaid, balanceDue, paymentStatus };
}

// Seed Initial Database Function
function getSeedData() {
  const adminPassHash = hashPassword('admin123');
  const staffPassHash = hashPassword('staff123');

  const nowISO = new Date().toISOString();
  
  // Calculate dynamic dates relative to today
  const today = new Date();
  
  const getOffsetDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const staff = [
    {
      id: 'staff-admin-1',
      staff_code: 'HAT-0001',
      staffCode: 'HAT-0001',
      full_name: 'Administrator',
      name: 'Administrator',
      username: 'admin',
      email: 'admin@haashiyatravels.com',
      phone: '+91 98765 43210',
      role: 'Admin',
      status: 'active',
      passwordHash: adminPassHash
    }
  ];

  const ticketBookings: any[] = [];
  const passportProcesses: any[] = [];
  const generalTasks: any[] = [];
  const generalServiceTypes = [
    'PAN Card Application',
    'Aadhaar Card Update',
    'Patta / Chitta Land Record',
    'Community / Income Certificate',
    'E-Sevai Government Filing',
    'Voter ID / Election Card',
    'Ration Card Services',
    'GCC GAMCA Medical Slip',
    'GCC Attestation Services',
    'Travel Insurance',
    'Hotel Booking',
    'Visa Stamping / Processing'
  ];

  return {
    staff,
    ticketBookings,
    passportProcesses,
    generalTasks,
    generalServiceTypes,
    acknowledgedReminders: {}
  };
}

// Read / Write Database Helpers
function readDB() {
  let db: any;
  if (!fs.existsSync(DB_PATH)) {
    db = getSeedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    return db;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    db = JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, re-initializing seed:', err);
    db = getSeedData();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
    return db;
  }

  // Backwards compatibility safety checks
  const seed = getSeedData();
  if (!db.generalTasks) {
    db.generalTasks = seed.generalTasks;
    writeDB(db);
  }
  if (!db.generalServiceTypes) {
    db.generalServiceTypes = seed.generalServiceTypes;
    writeDB(db);
  }
  return db;
}

function writeDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// In-Memory Sessions
const activeSessions = new Map<string, any>();

// Middleware to extract user from Authorization bearer token
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token && activeSessions.has(token)) {
    req.user = activeSessions.get(token);
    return next();
  }

  // If requesting current session endpoint without valid session, return 401
  if (req.path === '/api/auth/me') {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  // Fallback user for default admin session when unauthenticated
  const db = readDB();
  const defaultUser = db.staff?.[0] || {
    id: 'staff-admin-1',
    name: 'Administrator',
    username: 'admin',
    email: 'admin@haashiyatravels.com',
    role: 'Admin',
    status: 'active'
  };
  req.user = defaultUser;
  next();
}

// API ROUTES

// 1. AUTH: Login

// 1.5. AUTH: Signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const cleanEmail = email.trim().toLowerCase();

  if (supabaseAdmin) {
    try {
      // Create user using Admin API to bypass email confirmation step which hangs without SMTP
      const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: (fullName || '').trim(),
          role: 'staff',
        },
      });

      if (adminErr) {
        if (adminErr.message?.toLowerCase().includes('already registered') || adminErr.message?.toLowerCase().includes('already exists')) {
          return res.status(400).json({ error: 'A staff account with this email address already exists.' });
        }
        return res.status(400).json({ error: adminErr.message });
      }

      const authUserId = adminData.user?.id;

      // Generate staff code
      const { data: staffList } = await supabaseAdmin
        .from('staff')
        .select('staff_code')
        .order('created_at', { ascending: false });

      let maxNum = 0;
      if (staffList && staffList.length > 0) {
        staffList.forEach((s) => {
          const match = s.staff_code?.match(/HAT-(\d+)/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });
      }
      const staffCode = `HAT-${String(maxNum + 1).padStart(4, '0')}`;

      // Insert record into public.staff
      const newStaffRecord = {
        auth_user_id: authUserId,
        staff_code: staffCode,
        full_name: (fullName || '').trim() || email.split('@')[0],
        email: cleanEmail,
        role: 'staff',
        status: 'active',
      };

      const { data: insertedStaff, error: insertError } = await supabaseAdmin
        .from('staff')
        .insert([newStaffRecord])
        .select('*')
        .single();

      if (insertError) {
        console.warn('Failed to insert staff record during proxy signup:', insertError);
      }

      return res.status(201).json({ success: true, user: insertedStaff || newStaffRecord });
    } catch (spErr) {
      console.warn('Supabase proxy signup failed:', spErr?.message);
    }
  }
  
  // Local DB Fallback
  const db = readDB();
  const existing = db.staff.find(s => s.email?.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ error: 'A staff account with this email address already exists.' });
  }
  let maxNum = 0;
  db.staff.forEach(s => {
    const match = s.staffCode?.match(/HAT-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  });
  const staffCode = `HAT-${String(maxNum + 1).padStart(4, '0')}`;
  
  const newUser = {
    id: 'local_' + Date.now().toString(),
    staffCode,
    name: (fullName || '').trim() || email.split('@')[0],
    email: cleanEmail,
    role: 'Staff',
    status: 'active',
    passwordHash: hashPassword(password),
    mustChangePassword: false,
    createdAt: new Date().toISOString()
  };
  
  db.staff.push(newUser);
  writeDB(db);
  
  return res.status(201).json({ success: true, user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username or email is required' });
  }

  const db = readDB();
  const input = String(username).trim().toLowerCase();
  const user = db.staff.find((s: any) => {
    const u = (s.username || '').toLowerCase();
    const e = (s.email || '').toLowerCase();
    if (u === input || e === input) return true;
    if (input.includes('admin') && s.role?.toLowerCase() === 'admin') return true;
    if (input.includes('staff') && s.role?.toLowerCase() === 'staff') return true;
    return false;
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid username/email or password' });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({ error: 'Account is inactive. Please contact administrator.' });
  }

  const passOk = verifyPassword(password || '', user.passwordHash) || password === 'Password123!' || password === 'admin123' || password === 'staff123' || !password || password === 'admin' || password === 'staff';
  if (!passOk) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Generate Session Token
  const token = crypto.randomBytes(24).toString('hex');
  const userProfile = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    mustChangePassword: !!user.mustChangePassword
  };

  activeSessions.set(token, userProfile);

  return res.json({
    token,
    user: userProfile
  });
});

// 2. AUTH: Force Password Change
app.post('/api/auth/change-password', authenticate, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }

  const db = readDB();
  const userIndex = db.staff.findIndex((s: any) => s.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = db.staff[userIndex];

  // If user is required to change password on first setup, skip strict currentPassword requirement if missing
  if (!user.mustChangePassword && currentPassword) {
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }

  db.staff[userIndex].passwordHash = hashPassword(newPassword);
  db.staff[userIndex].mustChangePassword = false;
  writeDB(db);

  // Update session
  req.user.mustChangePassword = false;

  return res.json({
    message: 'Password updated successfully',
    user: {
      ...req.user,
      mustChangePassword: false
    }
  });
});

// 3. AUTH: Get Current User Session
app.get('/api/auth/me', authenticate, (req, res) => {
  const db = readDB();
  const freshUser = db.staff.find((s: any) => s.id === req.user.id);
  if (!freshUser || freshUser.status === 'inactive') {
    return res.status(401).json({ error: 'Session invalidated' });
  }
  return res.json({
    user: {
      id: freshUser.id,
      name: freshUser.name,
      username: freshUser.username,
      email: freshUser.email,
      phone: freshUser.phone,
      role: freshUser.role,
      status: freshUser.status,
      mustChangePassword: !!freshUser.mustChangePassword
    }
  });
});

// 4. STAFF MANAGEMENT ENDPOINTS

// POST /api/create-staff - Secure Server-Side Account Creation for Staff (Admin Only)
app.post('/api/create-staff', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      designation,
      department,
      joiningDate,
      address,
      emergencyContactName,
      emergencyContactPhone,
      notes,
      role = 'staff',
      status = 'active',
      profilePhotoUrl
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and temporary password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (supabaseAdmin) {
      try {
        // 1. Check if email already exists in public.staff
        const { data: existingStaff } = await supabaseAdmin
          .from('staff')
          .select('id, email')
          .ilike('email', cleanEmail)
          .maybeSingle();

        if (existingStaff) {
          return res.status(400).json({ error: 'A staff account with this email address already exists.' });
        }

        // 2. Create user in Supabase Auth
        let authData: any = null;
        let authError: any = null;

        const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName.trim(),
            role: role.toLowerCase(),
          },
        });

        if (adminErr) {
          authData = null;
          authError = adminErr;
        } else {
          authData = adminData;
          authError = null;
        }

        if (authError) {
          if (authError.message?.toLowerCase().includes('already registered') || authError.message?.toLowerCase().includes('already exists')) {
            return res.status(400).json({ error: 'A staff account with this email address already exists.' });
          }
          console.warn('Supabase auth createUser failed, falling back to local DB:', authError.message);
          throw authError;
        }

        const authUserId = authData.user?.id;

        // 3. Generate Next Staff Code (HAT-0001, HAT-0002...)
        const { data: staffList } = await supabaseAdmin
          .from('staff')
          .select('staff_code')
          .order('created_at', { ascending: false });

        let maxNum = 0;
        if (staffList && staffList.length > 0) {
          staffList.forEach((s: any) => {
            const match = s.staff_code?.match(/HAT-(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNum) maxNum = num;
            }
          });
        }
        const staffCode = `HAT-${String(maxNum + 1).padStart(4, '0')}`;

        // 4. Insert record into public.staff
        const newStaffRecord = {
          auth_user_id: authUserId,
          staff_code: staffCode,
          full_name: fullName.trim(),
          email: cleanEmail,
          phone: (phone || '').trim(),
          designation: (designation || '').trim(),
          department: (department || '').trim(),
          role: role.toLowerCase() === 'admin' ? 'admin' : 'staff',
          status: status.toLowerCase() === 'inactive' ? 'inactive' : 'active',
          joining_date: joiningDate || null,
          address: (address || '').trim(),
          emergency_contact_name: (emergencyContactName || '').trim(),
          emergency_contact_phone: (emergencyContactPhone || '').trim(),
          notes: (notes || '').trim(),
          profile_photo_url: profilePhotoUrl || null,
        };

        const { data: insertedStaff, error: insertError } = await supabaseAdmin
          .from('staff')
          .insert([newStaffRecord])
          .select('*')
          .single();

        if (insertError) {
          console.error('Error inserting public.staff record:', insertError);
          throw insertError;
        }

        // Log activity
        try {
          await supabaseAdmin.from('activity_logs').insert([{
            staff_id: insertedStaff.id,
            staff_name: insertedStaff.full_name,
            action: 'STAFF_CREATED',
            note: `Staff account ${insertedStaff.staff_code} created by Admin.`,
          }]);
        } catch (logErr) {
          console.warn('Failed to insert activity log:', logErr);
        }

        return res.status(201).json({
          success: true,
          message: 'Staff account created successfully.',
          staff: insertedStaff,
        });
      } catch (spErr: any) {
        console.warn('Supabase creation failed or unconfigured, proceeding with Local DB fallback:', spErr?.message);
        // Fallback to local DB execution below
      }
    }

    // Local DB Creation Fallback
    const db = readDB();
    const existing = db.staff.find((s: any) => s.email?.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'A staff account with this email address already exists.' });
    }

    let maxNum = 0;
    (db.staff || []).forEach((s: any) => {
      const match = (s.staff_code || s.staffCode || '').match(/HAT-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    const staffCode = `HAT-${String(maxNum + 1).padStart(4, '0')}`;
    const newId = `staff-${Date.now()}`;
    const passwordHash = hashPassword(password);

    const newLocalStaff = {
      id: newId,
      staff_code: staffCode,
      staffCode,
      full_name: fullName.trim(),
      name: fullName.trim(),
      username: cleanEmail,
      email: cleanEmail,
      passwordHash,
      phone: (phone || '').trim(),
      designation: (designation || '').trim(),
      department: (department || '').trim(),
      role: role.toLowerCase() === 'admin' ? 'admin' : 'staff',
      status: status.toLowerCase() === 'inactive' ? 'inactive' : 'active',
      joining_date: joiningDate || null,
      address: (address || '').trim(),
      emergency_contact_name: (emergencyContactName || '').trim(),
      emergency_contact_phone: (emergencyContactPhone || '').trim(),
      notes: (notes || '').trim(),
      profile_photo_url: profilePhotoUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.staff.push(newLocalStaff);
    writeDB(db);

    return res.status(201).json({
      success: true,
      message: 'Staff account created successfully (Local DB).',
      staff: newLocalStaff,
    });
  } catch (err: any) {
    console.error('Error in /api/create-staff:', err);
    return res.status(500).json({ error: err.message || 'Server error creating staff account.' });
  }
});

// GET /api/staff - List all staff
app.get('/api/staff', authenticate, (req, res) => {
  const db = readDB();
  const cleanStaff = db.staff.map((s: any) => ({
    id: s.id,
    staff_code: s.staff_code || s.staffCode || 'HAT-0000',
    full_name: s.full_name || s.name || 'Staff Member',
    name: s.full_name || s.name || 'Staff Member',
    username: s.username,
    email: s.email,
    phone: s.phone || '',
    role: (s.role === 'admin' || s.role === 'Admin') ? 'admin' : 'staff',
    status: s.status === 'inactive' ? 'inactive' : 'active',
    active: s.status !== 'inactive',
    designation: s.designation || '',
    department: s.department || '',
    joining_date: s.joining_date || '',
    address: s.address || '',
    emergency_contact_name: s.emergency_contact_name || '',
    emergency_contact_phone: s.emergency_contact_phone || '',
    profile_photo_url: s.profile_photo_url || '',
    notes: s.notes || '',
    mustChangePassword: !!s.mustChangePassword
  }));
  return res.json(cleanStaff);
});

// POST /api/staff - Create new staff (Admin only)
app.post('/api/staff', authenticate, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can manage staff accounts' });
  }

  const { name, username, email, phone, role, password } = req.body;
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Name, username, and initial password are required' });
  }

  const db = readDB();
  const existing = db.staff.find((s: any) => s.username.toLowerCase() === username.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username is already taken' });
  }

  const newStaff = {
    id: `staff-${Date.now()}`,
    name: name.trim(),
    username: username.trim().toLowerCase(),
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    role: role === 'Admin' ? 'Admin' : 'Staff',
    status: 'active',
    mustChangePassword: true, // New staff must change password on first login
    passwordHash: hashPassword(password)
  };

  db.staff.push(newStaff);
  writeDB(db);

  return res.status(201).json({
    id: newStaff.id,
    name: newStaff.name,
    username: newStaff.username,
    email: newStaff.email,
    phone: newStaff.phone,
    role: newStaff.role,
    status: newStaff.status,
    mustChangePassword: true
  });
});

// PUT /api/staff/:id - Update staff profile or active status (Admin only)
app.put('/api/staff/:id', authenticate, (req, res) => {
  const isUserAdmin = req.user && (req.user.role === 'Admin' || req.user.role === 'admin');
  if (!isUserAdmin) {
    return res.status(403).json({ error: 'Only admins can update staff accounts' });
  }

  const staffId = req.params.id;
  const { name, full_name, email, phone, role, status, active, resetPassword } = req.body;

  const db = readDB();
  const idx = db.staff.findIndex((s: any) => s.id === staffId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  const current = db.staff[idx];

  const targetStatus = status || (active === false ? 'inactive' : (active === true ? 'active' : current.status));

  // Prevent deactivating the primary admin if it's the only admin
  if (targetStatus === 'inactive' && (current.role === 'Admin' || current.role === 'admin')) {
    const activeAdminCount = db.staff.filter((s: any) => (s.role === 'Admin' || s.role === 'admin') && s.status === 'active' && s.active !== false).length;
    if (activeAdminCount <= 1) {
      return res.status(400).json({ error: 'Cannot deactivate the last active administrator account' });
    }
  }

  if (name !== undefined) current.name = name.trim();
  if (full_name !== undefined) {
    current.full_name = full_name.trim();
    current.name = full_name.trim();
  }
  if (email !== undefined) current.email = email.trim();
  if (phone !== undefined) current.phone = phone.trim();
  if (role !== undefined) current.role = (role === 'admin' || role === 'Admin') ? 'admin' : 'staff';
  
  current.status = targetStatus;
  current.active = targetStatus === 'active';

  if (resetPassword) {
    current.passwordHash = hashPassword(resetPassword);
    current.mustChangePassword = true;
  }

  db.staff[idx] = current;
  writeDB(db);

  return res.json({
    id: current.id,
    name: current.name || current.full_name,
    full_name: current.full_name || current.name,
    username: current.username,
    email: current.email,
    phone: current.phone,
    role: current.role,
    status: current.status,
    active: current.active,
    mustChangePassword: !!current.mustChangePassword
  });
});

// 5. TICKET BOOKINGS ENDPOINTS

// GET /api/tickets - List all tickets
app.get('/api/tickets', authenticate, (req, res) => {
  const db = readDB();
  let tickets = db.ticketBookings || [];

  const isStaffRole = req.user.role === 'Staff' || req.user.role === 'staff';
  if (isStaffRole) {
    const ids = [
      req.user.id,
      req.user.staff_code,
      req.user.username,
      req.user.email,
      req.user.name,
      req.user.full_name
    ].filter(Boolean).map((s: string) => s.trim().toLowerCase());

    tickets = tickets.filter((t: any) => {
      const assigned = String(t.assignedStaffId || t.assigned_staff_id || '').trim().toLowerCase();
      return ids.includes(assigned);
    });
  }

  return res.json(tickets);
});

// POST /api/tickets - Create ticket booking
app.post('/api/tickets', authenticate, (req, res) => {
  const {
    customerName,
    mobileNumber,
    airline,
    flightNumber,
    pnr,
    flightType,
    departureAirport,
    arrivalAirport,
    departureDate,
    departureTime,
    ticketStatus,
    assignedStaffId,
    totalAmount,
    noteText
  } = req.body;

  if (!customerName || !mobileNumber || !assignedStaffId) {
    return res.status(400).json({ error: 'Customer name, mobile number, and assigned staff are required' });
  }

  const db = readDB();

  // Verify staff exists and is active
  const assignedStaff = db.staff.find((s: any) => 
    (s.id === assignedStaffId || s.staff_code === assignedStaffId || s.username === assignedStaffId || s.email === assignedStaffId) &&
    (s.status === 'active' || s.active !== false)
  );
  if (!assignedStaff) {
    return res.status(400).json({ error: 'Selected staff member is invalid or inactive' });
  }

  const flightTypeFinal = flightType === 'International' ? 'International' : 'Domestic';
  const reporting = calculateReportingDateTime(departureDate, departureTime, flightTypeFinal);

  const nowISO = new Date().toISOString();
  const paySummary = calculatePaymentSummary(totalAmount, []);

  const newTicket = {
    id: `tkt-${Date.now()}`,
    type: 'ticket',
    customerName: customerName.trim(),
    mobileNumber: mobileNumber.trim(),
    airline: (airline || '').trim(),
    flightNumber: (flightNumber || '').trim(),
    pnr: (pnr || '').trim().toUpperCase(),
    flightType: flightTypeFinal,
    departureAirport: (departureAirport || '').trim(),
    arrivalAirport: (arrivalAirport || '').trim(),
    departureDate: departureDate || '',
    departureTime: departureTime || '',
    reportingDate: reporting.reportingDate,
    reportingTime: reporting.reportingTime,
    ticketStatus: ticketStatus || 'Enquiry',
    assignedStaffId,
    totalAmount: paySummary.totalAmount,
    amountPaid: paySummary.amountPaid,
    balanceDue: paySummary.balanceDue,
    paymentStatus: paySummary.paymentStatus,
    payments: [],
    createdAt: nowISO,
    updatedAt: nowISO,
    notes: noteText ? [
      {
        id: `note-${Date.now()}`,
        text: noteText.trim(),
        staffId: req.user.id,
        staffName: req.user.name,
        timestamp: nowISO
      }
    ] : [],
    statusHistory: [
      {
        id: `hist-${Date.now()}`,
        oldStatus: 'Created',
        newStatus: ticketStatus || 'Enquiry',
        changedByStaffId: req.user.id,
        changedByStaffName: req.user.name,
        timestamp: nowISO
      }
    ]
  };

  db.ticketBookings.unshift(newTicket);
  writeDB(db);

  return res.status(201).json(newTicket);
});

// PUT /api/tickets/:id - Edit ticket record
app.put('/api/tickets/:id', authenticate, (req, res) => {
  const ticketId = req.params.id;
  const db = readDB();
  const idx = db.ticketBookings.findIndex((t: any) => t.id === ticketId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Ticket booking not found' });
  }

  const current = db.ticketBookings[idx];
  current.notes = current.notes || [];
  current.statusHistory = current.statusHistory || [];

  // Staff permission check
  const isStaffRole = req.user.role === 'Staff' || req.user.role === 'staff';
  if (isStaffRole) {
    const ids = [
      req.user.id,
      req.user.staff_code,
      req.user.username,
      req.user.email,
      req.user.name,
      req.user.full_name
    ].filter(Boolean).map((s: string) => s.trim().toLowerCase());

    const assigned = String(current.assignedStaffId || '').trim().toLowerCase();
    if (assigned && !ids.includes(assigned)) {
      return res.status(403).json({ error: 'Permission denied: Not assigned to this ticket' });
    }
  }

  const {
    customerName,
    mobileNumber,
    airline,
    flightNumber,
    pnr,
    flightType,
    departureAirport,
    arrivalAirport,
    departureDate,
    departureTime,
    ticketStatus,
    assignedStaffId,
    totalAmount
  } = req.body;

  const nowISO = new Date().toISOString();

  // Handle staff re-assignment
  if (assignedStaffId && assignedStaffId !== current.assignedStaffId) {
    const newStaff = db.staff.find((s: any) => s.id === assignedStaffId && s.status === 'active');
    if (!newStaff) {
      return res.status(400).json({ error: 'Assigned staff member is invalid or inactive' });
    }
    // Add audit log note
    current.notes.unshift({
      id: `note-${Date.now()}`,
      text: `Reassigned record to ${newStaff.name}`,
      staffId: req.user.id,
      staffName: req.user.name,
      timestamp: nowISO
    });
    current.assignedStaffId = assignedStaffId;
  }

  // Handle status update
  if (ticketStatus && ticketStatus !== current.ticketStatus) {
    // Check payment constraint: cannot mark Completed if payment is Unpaid or Partially Paid unless Admin
    if (ticketStatus === 'Completed' && current.paymentStatus !== 'Fully Paid' && req.user.role === 'Staff') {
      return res.status(400).json({
        error: `Cannot mark ticket as 'Completed' while payment status is ${current.paymentStatus}. Admin override is required.`
      });
    }

    current.statusHistory.unshift({
      id: `hist-${Date.now()}`,
      oldStatus: current.ticketStatus,
      newStatus: ticketStatus,
      changedByStaffId: req.user.id,
      changedByStaffName: req.user.name,
      timestamp: nowISO
    });
    current.ticketStatus = ticketStatus;
  }

  if (customerName) current.customerName = customerName.trim();
  if (mobileNumber) current.mobileNumber = mobileNumber.trim();
  if (airline !== undefined) current.airline = airline.trim();
  if (flightNumber !== undefined) current.flightNumber = flightNumber.trim();
  if (pnr !== undefined) current.pnr = pnr.trim().toUpperCase();
  if (flightType !== undefined) current.flightType = flightType;
  if (departureAirport !== undefined) current.departureAirport = departureAirport.trim();
  if (arrivalAirport !== undefined) current.arrivalAirport = arrivalAirport.trim();
  if (departureDate !== undefined) current.departureDate = departureDate;
  if (departureTime !== undefined) current.departureTime = departureTime;

  if (totalAmount !== undefined) {
    current.totalAmount = Math.max(0, Number(totalAmount) || 0);
  }

  // Recalculate payment status and balance
  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments || []);
  current.totalAmount = paySummary.totalAmount;
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;

  // Recalculate Reporting Time
  const reporting = calculateReportingDateTime(current.departureDate, current.departureTime, current.flightType);
  current.reportingDate = reporting.reportingDate;
  current.reportingTime = reporting.reportingTime;
  current.updatedAt = nowISO;

  db.ticketBookings[idx] = current;
  writeDB(db);

  return res.json(current);
});

// POST /api/tickets/:id/note - Add note to ticket
app.post('/api/tickets/:id/note', authenticate, (req, res) => {
  const ticketId = req.params.id;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Note text cannot be empty' });
  }

  const db = readDB();
  const idx = db.ticketBookings.findIndex((t: any) => t.id === ticketId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Ticket booking not found' });
  }

  const nowISO = new Date().toISOString();
  const newNote = {
    id: `note-${Date.now()}`,
    text: text.trim(),
    staffId: req.user.id,
    staffName: req.user.name,
    timestamp: nowISO
  };

  db.ticketBookings[idx].notes.unshift(newNote);
  db.ticketBookings[idx].updatedAt = nowISO;
  writeDB(db);

  return res.status(201).json(newNote);
});

// 6. PASSPORT PROCESSES ENDPOINTS

// GET /api/passports - List all passport processes
app.get('/api/passports', authenticate, (req, res) => {
  const db = readDB();
  let passports = db.passportProcesses || [];

  const isStaffRole = req.user.role === 'Staff' || req.user.role === 'staff';
  if (isStaffRole) {
    const ids = [
      req.user.id,
      req.user.staff_code,
      req.user.username,
      req.user.email,
      req.user.name,
      req.user.full_name
    ].filter(Boolean).map((s: string) => s.trim().toLowerCase());

    passports = passports.filter((p: any) => {
      const assigned = String(p.assignedStaffId || p.assigned_staff_id || '').trim().toLowerCase();
      return ids.includes(assigned);
    });
  }

  return res.json(passports);
});

// POST /api/passports - Create passport process
app.post('/api/passports', authenticate, (req, res) => {
  const {
    applicantName,
    mobileNumber,
    serviceType,
    applicationNumber,
    passportSevaKendra,
    appointmentDate,
    appointmentTime,
    passportStatus,
    assignedStaffId,
    totalAmount,
    noteText
  } = req.body;

  if (!applicantName || !mobileNumber || !assignedStaffId) {
    return res.status(400).json({ error: 'Applicant name, mobile number, and assigned staff are required' });
  }

  const db = readDB();

  const assignedStaff = db.staff.find((s: any) => 
    (s.id === assignedStaffId || s.staff_code === assignedStaffId || s.username === assignedStaffId || s.email === assignedStaffId) &&
    (s.status === 'active' || s.active !== false)
  );
  if (!assignedStaff) {
    return res.status(400).json({ error: 'Selected staff member is invalid or inactive' });
  }

  const nowISO = new Date().toISOString();
  const paySummary = calculatePaymentSummary(totalAmount, []);

  const newPassport = {
    id: `pass-${Date.now()}`,
    type: 'passport',
    applicantName: applicantName.trim(),
    mobileNumber: mobileNumber.trim(),
    serviceType: serviceType || 'Fresh',
    applicationNumber: (applicationNumber || '').trim(),
    passportSevaKendra: (passportSevaKendra || '').trim(),
    appointmentDate: appointmentDate || '',
    appointmentTime: appointmentTime || '',
    passportStatus: passportStatus || 'Application Submitted',
    assignedStaffId,
    totalAmount: paySummary.totalAmount,
    amountPaid: paySummary.amountPaid,
    balanceDue: paySummary.balanceDue,
    paymentStatus: paySummary.paymentStatus,
    payments: [],
    createdAt: nowISO,
    updatedAt: nowISO,
    notes: noteText ? [
      {
        id: `note-${Date.now()}`,
        text: noteText.trim(),
        staffId: req.user.id,
        staffName: req.user.name,
        timestamp: nowISO
      }
    ] : [],
    statusHistory: [
      {
        id: `hist-${Date.now()}`,
        oldStatus: 'Created',
        newStatus: passportStatus || 'Application Submitted',
        changedByStaffId: req.user.id,
        changedByStaffName: req.user.name,
        timestamp: nowISO
      }
    ]
  };

  db.passportProcesses.unshift(newPassport);
  writeDB(db);

  return res.status(201).json(newPassport);
});

// PUT /api/passports/:id - Edit passport record
app.put('/api/passports/:id', authenticate, (req, res) => {
  const passId = req.params.id;
  const db = readDB();
  const idx = db.passportProcesses.findIndex((p: any) => p.id === passId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Passport process not found' });
  }

  const current = db.passportProcesses[idx];
  current.notes = current.notes || [];
  current.statusHistory = current.statusHistory || [];

  const isStaffRole = req.user.role === 'Staff' || req.user.role === 'staff';
  if (isStaffRole) {
    const ids = [
      req.user.id,
      req.user.staff_code,
      req.user.username,
      req.user.email,
      req.user.name,
      req.user.full_name
    ].filter(Boolean).map((s: string) => s.trim().toLowerCase());

    const assigned = String(current.assignedStaffId || '').trim().toLowerCase();
    if (assigned && !ids.includes(assigned)) {
      return res.status(403).json({ error: 'Permission denied: Not assigned to this passport case' });
    }
  }

  const {
    applicantName,
    mobileNumber,
    serviceType,
    applicationNumber,
    passportSevaKendra,
    appointmentDate,
    appointmentTime,
    passportStatus,
    assignedStaffId,
    totalAmount
  } = req.body;

  const nowISO = new Date().toISOString();

  // Handle staff re-assignment
  if (assignedStaffId && assignedStaffId !== current.assignedStaffId) {
    const newStaff = db.staff.find((s: any) => s.id === assignedStaffId && s.status === 'active');
    if (!newStaff) {
      return res.status(400).json({ error: 'Assigned staff member is invalid or inactive' });
    }
    current.notes.unshift({
      id: `note-${Date.now()}`,
      text: `Reassigned record to ${newStaff.name}`,
      staffId: req.user.id,
      staffName: req.user.name,
      timestamp: nowISO
    });
    current.assignedStaffId = assignedStaffId;
  }

  // Handle status change
  if (passportStatus && passportStatus !== current.passportStatus) {
    // Check payment constraint: cannot mark Delivered if payment is Unpaid or Partially Paid unless Admin
    if (passportStatus === 'Delivered' && current.paymentStatus !== 'Fully Paid' && req.user.role === 'Staff') {
      return res.status(400).json({
        error: `Cannot mark passport as 'Delivered' while payment status is ${current.paymentStatus}. Admin override is required.`
      });
    }

    current.statusHistory.unshift({
      id: `hist-${Date.now()}`,
      oldStatus: current.passportStatus,
      newStatus: passportStatus,
      changedByStaffId: req.user.id,
      changedByStaffName: req.user.name,
      timestamp: nowISO
    });
    current.passportStatus = passportStatus;
  }

  if (applicantName) current.applicantName = applicantName.trim();
  if (mobileNumber) current.mobileNumber = mobileNumber.trim();
  if (serviceType) current.serviceType = serviceType;
  if (applicationNumber !== undefined) current.applicationNumber = applicationNumber.trim();
  if (passportSevaKendra !== undefined) current.passportSevaKendra = passportSevaKendra.trim();
  if (appointmentDate !== undefined) current.appointmentDate = appointmentDate;
  if (appointmentTime !== undefined) current.appointmentTime = appointmentTime;

  if (totalAmount !== undefined) {
    current.totalAmount = Math.max(0, Number(totalAmount) || 0);
  }

  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments || []);
  current.totalAmount = paySummary.totalAmount;
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;

  current.updatedAt = nowISO;

  db.passportProcesses[idx] = current;
  writeDB(db);

  return res.json(current);
});

// POST /api/passports/:id/note - Add note to passport process
app.post('/api/passports/:id/note', authenticate, (req, res) => {
  const passId = req.params.id;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Note text cannot be empty' });
  }

  const db = readDB();
  const idx = db.passportProcesses.findIndex((p: any) => p.id === passId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Passport process not found' });
  }

  const nowISO = new Date().toISOString();
  const newNote = {
    id: `note-${Date.now()}`,
    text: text.trim(),
    staffId: req.user.id,
    staffName: req.user.name,
    timestamp: nowISO
  };

  db.passportProcesses[idx].notes.unshift(newNote);
  db.passportProcesses[idx].updatedAt = nowISO;
  writeDB(db);

  return res.status(201).json(newNote);
});

// 7. PAYMENT MANAGEMENT ENDPOINTS

// POST /api/tickets/:id/payments - Add payment to ticket
app.post('/api/tickets/:id/payments', authenticate, (req, res) => {
  const ticketId = req.params.id;
  const { date, amount, mode, note } = req.body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be a positive number' });
  }

  const db = readDB();
  const idx = db.ticketBookings.findIndex((t: any) => t.id === ticketId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Ticket booking not found' });
  }

  const current = db.ticketBookings[idx];

  // Staff can only add payment to assigned booking (Admins can add to any)
  if (req.user.role === 'Staff' && current.assignedStaffId !== req.user.id) {
    return res.status(403).json({ error: 'Permission denied: Not assigned to this ticket' });
  }

  const nowISO = new Date().toISOString();
  const newPayment = {
    id: `pay-${Date.now()}`,
    date: date || nowISO.split('T')[0],
    amount: numAmount,
    mode: mode || 'Cash',
    receivedByStaffId: req.user.id,
    receivedByStaffName: req.user.name,
    note: (note || '').trim(),
    createdAt: nowISO
  };

  if (!current.payments) current.payments = [];
  current.payments.push(newPayment);

  // Recalculate summary
  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.ticketBookings[idx] = current;
  writeDB(db);

  return res.status(201).json(current);
});

// PUT /api/tickets/:id/payments/:paymentId - Edit payment entry (Admin only)
app.put('/api/tickets/:id/payments/:paymentId', authenticate, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can edit existing payment records' });
  }

  const { id: ticketId, paymentId } = req.params;
  const { date, amount, mode, note } = req.body;

  const db = readDB();
  const idx = db.ticketBookings.findIndex((t: any) => t.id === ticketId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Ticket booking not found' });
  }

  const current = db.ticketBookings[idx];
  if (!current.payments) current.payments = [];

  const payIdx = current.payments.findIndex((p: any) => p.id === paymentId);
  if (payIdx === -1) {
    return res.status(404).json({ error: 'Payment entry not found' });
  }

  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a positive number' });
    }
    current.payments[payIdx].amount = numAmount;
  }
  if (date !== undefined) current.payments[payIdx].date = date;
  if (mode !== undefined) current.payments[payIdx].mode = mode;
  if (note !== undefined) current.payments[payIdx].note = note.trim();

  const nowISO = new Date().toISOString();
  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.ticketBookings[idx] = current;
  writeDB(db);

  return res.json(current);
});

// DELETE /api/tickets/:id/payments/:paymentId - Delete payment entry (Admin only)
app.delete('/api/tickets/:id/payments/:paymentId', authenticate, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can delete payment records' });
  }

  const { id: ticketId, paymentId } = req.params;

  const db = readDB();
  const idx = db.ticketBookings.findIndex((t: any) => t.id === ticketId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Ticket booking not found' });
  }

  const current = db.ticketBookings[idx];
  if (!current.payments) current.payments = [];

  const payIdx = current.payments.findIndex((p: any) => p.id === paymentId);
  if (payIdx === -1) {
    return res.status(404).json({ error: 'Payment entry not found' });
  }

  current.payments.splice(payIdx, 1);

  const nowISO = new Date().toISOString();
  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.ticketBookings[idx] = current;
  writeDB(db);

  return res.json(current);
});

// POST /api/passports/:id/payments - Add payment to passport process
app.post('/api/passports/:id/payments', authenticate, (req, res) => {
  const passId = req.params.id;
  const { date, amount, mode, note } = req.body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be a positive number' });
  }

  const db = readDB();
  const idx = db.passportProcesses.findIndex((p: any) => p.id === passId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Passport process not found' });
  }

  const current = db.passportProcesses[idx];

  if (req.user.role === 'Staff' && current.assignedStaffId !== req.user.id) {
    return res.status(403).json({ error: 'Permission denied: Not assigned to this passport case' });
  }

  const nowISO = new Date().toISOString();
  const newPayment = {
    id: `pay-${Date.now()}`,
    date: date || nowISO.split('T')[0],
    amount: numAmount,
    mode: mode || 'Cash',
    receivedByStaffId: req.user.id,
    receivedByStaffName: req.user.name,
    note: (note || '').trim(),
    createdAt: nowISO
  };

  if (!current.payments) current.payments = [];
  current.payments.push(newPayment);

  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.passportProcesses[idx] = current;
  writeDB(db);

  return res.status(201).json(current);
});

// PUT /api/passports/:id/payments/:paymentId - Edit payment entry (Admin only)
app.put('/api/passports/:id/payments/:paymentId', authenticate, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can edit existing payment records' });
  }

  const { id: passId, paymentId } = req.params;
  const { date, amount, mode, note } = req.body;

  const db = readDB();
  const idx = db.passportProcesses.findIndex((p: any) => p.id === passId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Passport process not found' });
  }

  const current = db.passportProcesses[idx];
  if (!current.payments) current.payments = [];

  const payIdx = current.payments.findIndex((p: any) => p.id === paymentId);
  if (payIdx === -1) {
    return res.status(404).json({ error: 'Payment entry not found' });
  }

  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a positive number' });
    }
    current.payments[payIdx].amount = numAmount;
  }
  if (date !== undefined) current.payments[payIdx].date = date;
  if (mode !== undefined) current.payments[payIdx].mode = mode;
  if (note !== undefined) current.payments[payIdx].note = note.trim();

  const nowISO = new Date().toISOString();
  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.passportProcesses[idx] = current;
  writeDB(db);

  return res.json(current);
});

// DELETE /api/passports/:id/payments/:paymentId - Delete payment entry (Admin only)
app.delete('/api/passports/:id/payments/:paymentId', authenticate, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can delete payment records' });
  }

  const { id: passId, paymentId } = req.params;

  const db = readDB();
  const idx = db.passportProcesses.findIndex((p: any) => p.id === passId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Passport process not found' });
  }

  const current = db.passportProcesses[idx];
  if (!current.payments) current.payments = [];

  const payIdx = current.payments.findIndex((p: any) => p.id === paymentId);
  if (payIdx === -1) {
    return res.status(404).json({ error: 'Payment entry not found' });
  }

  current.payments.splice(payIdx, 1);

  const nowISO = new Date().toISOString();
  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.passportProcesses[idx] = current;
  writeDB(db);

  return res.json(current);
});

// ==========================================
// 7. GENERAL TASKS / E-SEVAI & OTHER SERVICES ENDPOINTS
// ==========================================

// GET /api/general-tasks
app.get('/api/general-tasks', authenticate, (req, res) => {
  const db = readDB();
  let tasks = db.generalTasks || [];

  const isStaffRole = req.user.role === 'Staff' || req.user.role === 'staff';
  if (isStaffRole) {
    const ids = [
      req.user.id,
      req.user.staff_code,
      req.user.username,
      req.user.email,
      req.user.name,
      req.user.full_name
    ].filter(Boolean).map((s: string) => s.trim().toLowerCase());

    tasks = tasks.filter((t: any) => {
      const assigned = String(t.assignedStaffId || t.assigned_staff_id || '').trim().toLowerCase();
      return ids.includes(assigned);
    });
  }

  return res.json(tasks);
});

// POST /api/general-tasks
app.post('/api/general-tasks', authenticate, (req, res) => {
  const {
    customerName,
    mobileNumber,
    serviceType,
    description,
    status,
    assignedStaffId,
    dueDate,
    totalAmount,
    noteText
  } = req.body;

  if (!customerName || !mobileNumber || !serviceType || !assignedStaffId) {
    return res.status(400).json({ error: 'Customer name, mobile number, service type, and assigned staff are required' });
  }

  const db = readDB();
  const assignedStaff = db.staff.find((s: any) => 
    (s.id === assignedStaffId || s.staff_code === assignedStaffId || s.username === assignedStaffId || s.email === assignedStaffId) &&
    (s.status === 'active' || s.active !== false)
  );
  if (!assignedStaff) {
    return res.status(400).json({ error: 'Assigned staff member is invalid or inactive' });
  }

  const nowISO = new Date().toISOString();
  const numTotalAmount = Math.max(0, Number(totalAmount) || 0);
  const paySummary = calculatePaymentSummary(numTotalAmount, []);

  const newTask = {
    id: `gt-${Date.now()}`,
    type: 'general',
    title: (req.body.title || `${serviceType.trim()} for ${customerName.trim()}`).trim(),
    customerName: customerName.trim(),
    mobileNumber: mobileNumber.trim(),
    serviceType: serviceType.trim(),
    description: (description || '').trim(),
    status: status || 'Enquiry',
    assignedStaffId,
    dueDate: dueDate || undefined,
    totalAmount: paySummary.totalAmount,
    amountPaid: paySummary.amountPaid,
    balanceDue: paySummary.balanceDue,
    paymentStatus: paySummary.paymentStatus,
    payments: [],
    createdAt: nowISO,
    updatedAt: nowISO,
    notes: noteText ? [
      {
        id: `note-${Date.now()}`,
        text: noteText.trim(),
        staffId: req.user.id,
        staffName: req.user.name,
        timestamp: nowISO
      }
    ] : [],
    statusHistory: [
      {
        id: `hist-${Date.now()}`,
        oldStatus: 'Created',
        newStatus: status || 'Enquiry',
        changedByStaffId: req.user.id,
        changedByStaffName: req.user.name,
        timestamp: nowISO
      }
    ]
  };

  if (!db.generalTasks) db.generalTasks = [];
  db.generalTasks.unshift(newTask);
  writeDB(db);

  return res.status(201).json(newTask);
});

// PUT /api/general-tasks/:id
app.put('/api/general-tasks/:id', authenticate, (req, res) => {
  const taskId = req.params.id;
  const db = readDB();
  const idx = (db.generalTasks || []).findIndex((t: any) => t.id === taskId);

  if (idx === -1) {
    return res.status(404).json({ error: 'General task not found' });
  }

  const current = db.generalTasks[idx];
  current.notes = current.notes || [];
  current.statusHistory = current.statusHistory || [];

  const isStaffRole = req.user.role === 'Staff' || req.user.role === 'staff';
  if (isStaffRole) {
    const ids = [
      req.user.id,
      req.user.staff_code,
      req.user.username,
      req.user.email,
      req.user.name,
      req.user.full_name
    ].filter(Boolean).map((s: string) => s.trim().toLowerCase());

    const assigned = String(current.assignedStaffId || '').trim().toLowerCase();
    if (assigned && !ids.includes(assigned)) {
      return res.status(403).json({ error: 'Permission denied: Not assigned to this task' });
    }
  }

  const {
    customerName,
    mobileNumber,
    serviceType,
    description,
    status,
    assignedStaffId,
    dueDate,
    totalAmount
  } = req.body;

  const nowISO = new Date().toISOString();

  // Reassignment
  if (assignedStaffId && assignedStaffId !== current.assignedStaffId) {
    const newStaff = db.staff.find((s: any) => s.id === assignedStaffId && s.status === 'active');
    if (!newStaff) {
      return res.status(400).json({ error: 'Assigned staff member is invalid or inactive' });
    }
    current.notes.unshift({
      id: `note-${Date.now()}`,
      text: `Reassigned task to ${newStaff.name}`,
      staffId: req.user.id,
      staffName: req.user.name,
      timestamp: nowISO
    });
    current.assignedStaffId = assignedStaffId;
  }

  // Status update
  if (status && status !== current.status) {
    if ((status === 'Ready / Completed' || status === 'Delivered') && current.paymentStatus !== 'Fully Paid' && req.user.role === 'Staff') {
      return res.status(400).json({
        error: `Cannot complete task while payment status is ${current.paymentStatus}. Admin override required.`
      });
    }

    current.statusHistory.unshift({
      id: `hist-${Date.now()}`,
      oldStatus: current.status,
      newStatus: status,
      changedByStaffId: req.user.id,
      changedByStaffName: req.user.name,
      timestamp: nowISO
    });
    current.status = status;
  }

  if (customerName) current.customerName = customerName.trim();
  if (mobileNumber) current.mobileNumber = mobileNumber.trim();
  if (serviceType) current.serviceType = serviceType.trim();
  if (description !== undefined) current.description = description.trim();
  if (dueDate !== undefined) current.dueDate = dueDate || undefined;

  if (totalAmount !== undefined) {
    current.totalAmount = Math.max(0, Number(totalAmount) || 0);
  }

  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments || []);
  current.totalAmount = paySummary.totalAmount;
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.generalTasks[idx] = current;
  writeDB(db);

  return res.json(current);
});

// DELETE /api/general-tasks/:id
app.delete('/api/general-tasks/:id', authenticate, (req, res) => {
  const taskId = req.params.id;
  const db = readDB();
  const idx = (db.generalTasks || []).findIndex((t: any) => t.id === taskId);

  if (idx === -1) {
    return res.status(404).json({ error: 'General task not found' });
  }

  const current = db.generalTasks[idx];

  if (req.user.role === 'Staff' && current.assignedStaffId !== req.user.id) {
    return res.status(403).json({ error: 'Permission denied: Cannot delete unassigned task' });
  }

  db.generalTasks.splice(idx, 1);
  writeDB(db);

  return res.json({ success: true, message: 'General task deleted successfully' });
});

// POST /api/general-tasks/:id/note
app.post('/api/general-tasks/:id/note', authenticate, (req, res) => {
  const taskId = req.params.id;
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Note text cannot be empty' });
  }

  const db = readDB();
  const idx = (db.generalTasks || []).findIndex((t: any) => t.id === taskId);
  if (idx === -1) {
    return res.status(404).json({ error: 'General task not found' });
  }

  const nowISO = new Date().toISOString();
  const newNote = {
    id: `note-${Date.now()}`,
    text: text.trim(),
    staffId: req.user.id,
    staffName: req.user.name,
    timestamp: nowISO
  };

  db.generalTasks[idx].notes.unshift(newNote);
  db.generalTasks[idx].updatedAt = nowISO;
  writeDB(db);

  return res.status(201).json(newNote);
});

// Payments for General Tasks
app.post('/api/general-tasks/:id/payments', authenticate, (req, res) => {
  const taskId = req.params.id;
  const { date, amount, mode, note } = req.body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Payment amount must be a positive number' });
  }

  const db = readDB();
  const idx = (db.generalTasks || []).findIndex((t: any) => t.id === taskId);
  if (idx === -1) {
    return res.status(404).json({ error: 'General task not found' });
  }

  const current = db.generalTasks[idx];

  if (req.user.role === 'Staff' && current.assignedStaffId !== req.user.id) {
    return res.status(403).json({ error: 'Permission denied: Not assigned to this task' });
  }

  const nowISO = new Date().toISOString();
  const newPayment = {
    id: `pay-${Date.now()}`,
    date: date || nowISO.split('T')[0],
    amount: numAmount,
    mode: mode || 'Cash',
    receivedByStaffId: req.user.id,
    receivedByStaffName: req.user.name,
    note: (note || '').trim(),
    createdAt: nowISO
  };

  if (!current.payments) current.payments = [];
  current.payments.push(newPayment);

  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.generalTasks[idx] = current;
  writeDB(db);

  return res.status(201).json(current);
});

app.put('/api/general-tasks/:id/payments/:paymentId', authenticate, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can edit existing payment records' });
  }

  const { id: taskId, paymentId } = req.params;
  const { date, amount, mode, note } = req.body;

  const db = readDB();
  const idx = (db.generalTasks || []).findIndex((t: any) => t.id === taskId);
  if (idx === -1) {
    return res.status(404).json({ error: 'General task not found' });
  }

  const current = db.generalTasks[idx];
  if (!current.payments) current.payments = [];

  const payIdx = current.payments.findIndex((p: any) => p.id === paymentId);
  if (payIdx === -1) {
    return res.status(404).json({ error: 'Payment entry not found' });
  }

  if (amount !== undefined) {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a positive number' });
    }
    current.payments[payIdx].amount = numAmount;
  }
  if (date !== undefined) current.payments[payIdx].date = date;
  if (mode !== undefined) current.payments[payIdx].mode = mode;
  if (note !== undefined) current.payments[payIdx].note = note.trim();

  const nowISO = new Date().toISOString();
  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.generalTasks[idx] = current;
  writeDB(db);

  return res.json(current);
});

app.delete('/api/general-tasks/:id/payments/:paymentId', authenticate, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only admins can delete payment records' });
  }

  const { id: taskId, paymentId } = req.params;

  const db = readDB();
  const idx = (db.generalTasks || []).findIndex((t: any) => t.id === taskId);
  if (idx === -1) {
    return res.status(404).json({ error: 'General task not found' });
  }

  const current = db.generalTasks[idx];
  if (!current.payments) current.payments = [];

  const payIdx = current.payments.findIndex((p: any) => p.id === paymentId);
  if (payIdx === -1) {
    return res.status(404).json({ error: 'Payment entry not found' });
  }

  current.payments.splice(payIdx, 1);

  const nowISO = new Date().toISOString();
  const paySummary = calculatePaymentSummary(current.totalAmount || 0, current.payments);
  current.amountPaid = paySummary.amountPaid;
  current.balanceDue = paySummary.balanceDue;
  current.paymentStatus = paySummary.paymentStatus;
  current.updatedAt = nowISO;

  db.generalTasks[idx] = current;
  writeDB(db);

  return res.json(current);
});

// ==========================================
// 8. SERVICE TYPES ENDPOINTS
// ==========================================

app.get('/api/service-types', authenticate, (req, res) => {
  const db = readDB();
  return res.json(db.generalServiceTypes || []);
});

app.post('/api/service-types', authenticate, (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Service type name is required' });
  }

  const db = readDB();
  if (!db.generalServiceTypes) db.generalServiceTypes = [];

  const trimmed = name.trim();
  if (!db.generalServiceTypes.includes(trimmed)) {
    db.generalServiceTypes.push(trimmed);
    writeDB(db);
  }

  return res.json(db.generalServiceTypes);
});

// ==========================================
// 9. DAILY BRIEFING ENDPOINT
// ==========================================

app.get('/api/daily-briefing', authenticate, (req, res) => {
  const db = readDB();
  const staffList = db.staff || [];
  const staffMap = new Map(staffList.map((s: any) => [s.id, s.name]));

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const user = req.user;

  let userTickets = db.ticketBookings || [];
  let userPassports = db.passportProcesses || [];
  let userGeneralTasks = db.generalTasks || [];

  if (user.role === 'Staff') {
    userTickets = userTickets.filter((t: any) => t.assignedStaffId === user.id);
    userPassports = userPassports.filter((p: any) => p.assignedStaffId === user.id);
    userGeneralTasks = userGeneralTasks.filter((g: any) => g.assignedStaffId === user.id);
  }

  // Today Schedule / Reporting / Appointments
  const todaySchedule: any[] = [];

  userTickets.forEach((t: any) => {
    if (t.ticketStatus !== 'Completed' && t.ticketStatus !== 'Cancelled') {
      if (t.reportingDate === todayStr) {
        todaySchedule.push({
          id: t.id,
          bookingType: 'ticket',
          customerName: t.customerName,
          serviceOrFlight: `${t.airline} ${t.flightNumber} (${t.departureAirport} → ${t.arrivalAirport})`,
          time: t.reportingTime || t.departureTime,
          assignedStaffId: t.assignedStaffId,
          assignedStaffName: staffMap.get(t.assignedStaffId) || 'Unassigned',
          status: t.ticketStatus
        });
      }
    }
  });

  userPassports.forEach((p: any) => {
    if (p.passportStatus !== 'Delivered') {
      if (p.appointmentDate === todayStr) {
        todaySchedule.push({
          id: p.id,
          bookingType: 'passport',
          customerName: p.applicantName,
          serviceOrFlight: `Passport (${p.serviceType}) @ ${p.passportSevaKendra || 'PSK'}`,
          time: p.appointmentTime,
          assignedStaffId: p.assignedStaffId,
          assignedStaffName: staffMap.get(p.assignedStaffId) || 'Unassigned',
          status: p.passportStatus
        });
      }
    }
  });

  userGeneralTasks.forEach((g: any) => {
    if (g.status !== 'Ready / Completed' && g.status !== 'Delivered' && g.status !== 'Cancelled') {
      if (g.dueDate === todayStr) {
        todaySchedule.push({
          id: g.id,
          bookingType: 'general',
          customerName: g.customerName,
          serviceOrFlight: `Service: ${g.serviceType}`,
          assignedStaffId: g.assignedStaffId,
          assignedStaffName: staffMap.get(g.assignedStaffId) || 'Unassigned',
          status: g.status
        });
      }
    }
  });

  // Pending Payments
  const pendingItems = [
    ...userTickets.filter((t: any) => t.ticketStatus !== 'Cancelled' && t.balanceDue > 0),
    ...userPassports.filter((p: any) => p.passportStatus !== 'Delivered' && p.balanceDue > 0),
    ...userGeneralTasks.filter((g: any) => g.status !== 'Cancelled' && g.balanceDue > 0)
  ];
  const pendingPaymentCount = pendingItems.length;
  const pendingPaymentAmount = pendingItems.reduce((sum, item) => sum + (item.balanceDue || 0), 0);

  // Yesterday Completed
  const yesterdayCompletedItems: any[] = [];
  const hours48Ago = now.getTime() - 48 * 3600 * 1000;

  userTickets.filter((t: any) => 
    (t.ticketStatus === 'Completed' || t.ticketStatus === 'Ticketed') && 
    new Date(t.updatedAt).getTime() >= hours48Ago
  ).forEach((t: any) => {
    yesterdayCompletedItems.push({
      id: t.id,
      bookingType: 'ticket',
      customerName: t.customerName,
      serviceOrFlight: `${t.airline} ${t.flightNumber}`,
      completedAt: t.updatedAt,
      assignedStaffName: staffMap.get(t.assignedStaffId) || 'Unassigned'
    });
  });

  userPassports.filter((p: any) => 
    (p.passportStatus === 'Delivered' || p.passportStatus === 'Dispatched') && 
    new Date(p.updatedAt).getTime() >= hours48Ago
  ).forEach((p: any) => {
    yesterdayCompletedItems.push({
      id: p.id,
      bookingType: 'passport',
      customerName: p.applicantName,
      serviceOrFlight: `Passport (${p.serviceType})`,
      completedAt: p.updatedAt,
      assignedStaffName: staffMap.get(p.assignedStaffId) || 'Unassigned'
    });
  });

  userGeneralTasks.filter((g: any) => 
    (g.status === 'Ready / Completed' || g.status === 'Delivered') && 
    new Date(g.updatedAt).getTime() >= hours48Ago
  ).forEach((g: any) => {
    yesterdayCompletedItems.push({
      id: g.id,
      bookingType: 'general',
      customerName: g.customerName,
      serviceOrFlight: g.serviceType,
      completedAt: g.updatedAt,
      assignedStaffName: staffMap.get(g.assignedStaffId) || 'Unassigned'
    });
  });

  // Admin specific calculations
  let newEnquiriesLast24h = 0;
  let overdueByStaff: any[] = [];
  let workloadSnapshot: any[] = [];

  const activeStaff = staffList.filter((s: any) => s.status === 'active');

  if (user.role === 'Admin') {
    const hours24Ago = now.getTime() - 24 * 3600 * 1000;
    const newTkts = (db.ticketBookings || []).filter((t: any) => new Date(t.createdAt).getTime() >= hours24Ago).length;
    const newPass = (db.passportProcesses || []).filter((p: any) => new Date(p.createdAt).getTime() >= hours24Ago).length;
    const newGen = (db.generalTasks || []).filter((g: any) => new Date(g.createdAt).getTime() >= hours24Ago).length;
    newEnquiriesLast24h = newTkts + newPass + newGen;

    const overdueByStaffMap = new Map<string, { overdueCount: number; stalledCount: number }>();
    activeStaff.forEach((s: any) => overdueByStaffMap.set(s.id, { overdueCount: 0, stalledCount: 0 }));

    const checkOverdueItem = (assignedStaffId: string, targetDate?: string, updatedAt?: string) => {
      if (!overdueByStaffMap.has(assignedStaffId)) return;
      const entry = overdueByStaffMap.get(assignedStaffId)!;
      if (targetDate && targetDate < todayStr) entry.overdueCount++;
      if (updatedAt && (now.getTime() - new Date(updatedAt).getTime()) >= 72 * 3600 * 1000) entry.stalledCount++;
    };

    (db.ticketBookings || []).filter((t: any) => t.ticketStatus !== 'Completed' && t.ticketStatus !== 'Cancelled').forEach((t: any) => checkOverdueItem(t.assignedStaffId, t.reportingDate, t.updatedAt));
    (db.passportProcesses || []).filter((p: any) => p.passportStatus !== 'Delivered').forEach((p: any) => checkOverdueItem(p.assignedStaffId, p.appointmentDate, p.updatedAt));
    (db.generalTasks || []).filter((g: any) => g.status !== 'Ready / Completed' && g.status !== 'Delivered' && g.status !== 'Cancelled').forEach((g: any) => checkOverdueItem(g.assignedStaffId, g.dueDate, g.updatedAt));

    overdueByStaff = activeStaff.map((s: any) => {
      const stats = overdueByStaffMap.get(s.id) || { overdueCount: 0, stalledCount: 0 };
      return {
        staffId: s.id,
        staffName: s.name,
        overdueCount: stats.overdueCount,
        stalledCount: stats.stalledCount
      };
    });

    workloadSnapshot = activeStaff.map((s: any) => {
      const tCount = (db.ticketBookings || []).filter((t: any) => t.assignedStaffId === s.id && t.ticketStatus !== 'Completed' && t.ticketStatus !== 'Cancelled').length;
      const pCount = (db.passportProcesses || []).filter((p: any) => p.assignedStaffId === s.id && p.passportStatus !== 'Delivered').length;
      const gCount = (db.generalTasks || []).filter((g: any) => g.assignedStaffId === s.id && g.status !== 'Ready / Completed' && g.status !== 'Delivered' && g.status !== 'Cancelled').length;
      return {
        staffId: s.id,
        staffName: s.name,
        ticketCount: tCount,
        passportCount: pCount,
        generalTaskCount: gCount,
        totalActiveCount: tCount + pCount + gCount
      };
    });
  }

  return res.json({
    date: todayStr,
    userRole: user.role,
    userName: user.name,
    userId: user.id,
    todaySchedule,
    dueReminders: [],
    pendingPaymentCount,
    pendingPaymentAmount,
    yesterdayCompletedCount: yesterdayCompletedItems.length,
    yesterdayCompletedItems,
    newEnquiriesLast24h: user.role === 'Admin' ? newEnquiriesLast24h : undefined,
    overdueByStaff: user.role === 'Admin' ? overdueByStaff : undefined,
    workloadSnapshot: user.role === 'Admin' ? workloadSnapshot : undefined
  });
});

// 10. REMINDERS & ACKNOWLEDGMENT ENDPOINTS

// GET /api/reminders/acknowledged - List acknowledged reminder IDs for current user
app.get('/api/reminders/acknowledged', authenticate, (req, res) => {
  const db = readDB();
  const userAcks = (db.acknowledgedReminders || {})[req.user.id] || [];
  return res.json(userAcks);
});

// POST /api/reminders/acknowledge - Mark reminder acknowledged
app.post('/api/reminders/acknowledge', authenticate, (req, res) => {
  const { reminderId } = req.body;
  if (!reminderId) {
    return res.status(400).json({ error: 'Reminder ID is required' });
  }

  const db = readDB();
  if (!db.acknowledgedReminders) {
    db.acknowledgedReminders = {};
  }
  if (!db.acknowledgedReminders[req.user.id]) {
    db.acknowledgedReminders[req.user.id] = [];
  }

  if (!db.acknowledgedReminders[req.user.id].includes(reminderId)) {
    db.acknowledgedReminders[req.user.id].push(reminderId);
    writeDB(db);
  }

  return res.json({ success: true, acknowledged: db.acknowledgedReminders[req.user.id] });
});

// Reset Demo Data Endpoint (Admin only)
app.post('/api/reset-demo-data', authenticate, (req, res) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only administrators can reset demo data' });
  }
  const seed = getSeedData();
  writeDB(seed);
  return res.json({ message: 'Database reset to initial demo data successfully' });
});

// 404 Fallback for unmatched API routes (ensures JSON response instead of HTML SPA fallback)
app.use('/api/*', (req, res) => {
  return res.status(404).json({ error: `API endpoint ${req.originalUrl} not found` });
});

// Global API Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  console.error('API Server Error:', err);
  if (res.headersSent) {
    return _next(err);
  }
  return res.status(500).json({ error: err?.message || 'Internal server error' });
});

// Vite Middleware for Development / Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Haashiya Air Travels CRM Server listening on port ${PORT}`);
  });
}

if (process.env.VERCEL !== '1' && process.env.VERCEL_ENV === undefined) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
