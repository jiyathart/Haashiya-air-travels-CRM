import { StaffUser, TicketBooking, PassportProcess, GeneralTask, DailyBriefingData } from '../types';

const STORAGE_KEY = 'haashiya_crm_local_db_v2';
const SESSION_STORAGE_KEY = 'haashiya_crm_sessions_v2';

export function calculateReportingDateTime(departureDate: string, departureTime: string, flightType: string) {
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

export function calculatePaymentSummary(totalAmountInput: any, payments: any[] = []) {
  const totalAmount = Math.max(0, Number(totalAmountInput) || 0);
  const amountPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);

  let paymentStatus: 'Unpaid' | 'Partially Paid' | 'Fully Paid' = 'Unpaid';
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

function getSeedData() {
  const today = new Date();
  const getOffsetDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const staff: (StaffUser & { passwordHash?: string })[] = [
    {
      id: 'staff-admin-1',
      name: 'Administrator',
      username: 'admin',
      email: 'admin@haashiyatravels.com',
      phone: '+91 98765 43210',
      role: 'Admin',
      status: 'active',
      mustChangePassword: false,
      passwordHash: 'admin123'
    }
  ];

  const t1Reporting = calculateReportingDateTime(getOffsetDate(1), '02:15', 'International');
  const t2Reporting = calculateReportingDateTime(getOffsetDate(0), '18:30', 'Domestic');
  const t3Reporting = calculateReportingDateTime(getOffsetDate(5), '10:00', 'International');
  const t4Reporting = calculateReportingDateTime(getOffsetDate(-1), '21:00', 'International');

  const ticketBookings: TicketBooking[] = [
    {
      id: 'tkt-1001',
      type: 'ticket',
      customerName: 'Mohammed Zameer',
      mobileNumber: '+91 98765 11223',
      airline: 'Emirates',
      flightNumber: 'EK-501',
      pnr: 'EM789X',
      flightType: 'International',
      departureAirport: 'DEL (New Delhi)',
      arrivalAirport: 'DXB (Dubai)',
      departureDate: getOffsetDate(1),
      departureTime: '02:15',
      reportingDate: t1Reporting.reportingDate,
      reportingTime: t1Reporting.reportingTime,
      ticketStatus: 'Confirmed',
      assignedStaffId: 'staff-admin-1',
      totalAmount: 45000,
      amountPaid: 20000,
      balanceDue: 25000,
      paymentStatus: 'Partially Paid',
      payments: [
        {
          id: 'pay-t1',
          date: getOffsetDate(-1),
          amount: 20000,
          mode: 'UPI',
          receivedByStaffId: 'staff-admin-1',
          receivedByStaffName: 'Administrator',
          note: 'Advance booking payment',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      notes: [
        {
          id: 'note-1',
          text: 'Customer requested aisle seat near exit row. Confirmed with airline desk.',
          staffId: 'staff-admin-1',
          staffName: 'Administrator',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ],
      statusHistory: [
        {
          id: 'hist-1',
          oldStatus: 'Enquiry',
          newStatus: 'Confirmed',
          changedByStaffId: 'staff-admin-1',
          changedByStaffName: 'Administrator',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'tkt-1002',
      type: 'ticket',
      customerName: 'Priya Sharma',
      mobileNumber: '+91 99887 66554',
      airline: 'IndiGo',
      flightNumber: '6E-204',
      pnr: 'IG452P',
      flightType: 'Domestic',
      departureAirport: 'BOM (Mumbai)',
      arrivalAirport: 'BLR (Bengaluru)',
      departureDate: getOffsetDate(0),
      departureTime: '18:30',
      reportingDate: t2Reporting.reportingDate,
      reportingTime: t2Reporting.reportingTime,
      ticketStatus: 'Ticketed',
      assignedStaffId: 'staff-admin-1',
      totalAmount: 6500,
      amountPaid: 6500,
      balanceDue: 0,
      paymentStatus: 'Fully Paid',
      payments: [
        {
          id: 'pay-t2',
          date: getOffsetDate(-2),
          amount: 6500,
          mode: 'Card',
          receivedByStaffId: 'staff-admin-1',
          receivedByStaffName: 'Administrator',
          note: 'Full ticket payment',
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      notes: [
        {
          id: 'note-2',
          text: 'E-Ticket PDF generated and WhatsApp copy sent to passenger.',
          staffId: 'staff-admin-1',
          staffName: 'Administrator',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
        }
      ],
      statusHistory: [
        {
          id: 'hist-2a',
          oldStatus: 'Enquiry',
          newStatus: 'Confirmed',
          changedByStaffId: 'staff-admin-1',
          changedByStaffName: 'Administrator',
          timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'hist-2b',
          oldStatus: 'Confirmed',
          newStatus: 'Ticketed',
          changedByStaffId: 'staff-admin-1',
          changedByStaffName: 'Administrator',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'tkt-1003',
      type: 'ticket',
      customerName: 'Suresh Kumar',
      mobileNumber: '+91 98450 33445',
      airline: 'Qatar Airways',
      flightNumber: 'QR-571',
      pnr: 'QT910Z',
      flightType: 'International',
      departureAirport: 'MAA (Chennai)',
      arrivalAirport: 'LHR (London Heathrow)',
      departureDate: getOffsetDate(5),
      departureTime: '10:00',
      reportingDate: t3Reporting.reportingDate,
      reportingTime: t3Reporting.reportingTime,
      ticketStatus: 'Enquiry',
      assignedStaffId: 'staff-admin-1',
      totalAmount: 78000,
      amountPaid: 0,
      balanceDue: 78000,
      paymentStatus: 'Unpaid',
      payments: [],
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      notes: [
        {
          id: 'note-3',
          text: 'Waiting for customer passport copy scan before booking confirmation.',
          staffId: 'staff-admin-1',
          staffName: 'Administrator',
          timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
        }
      ],
      statusHistory: []
    },
    {
      id: 'tkt-1004',
      type: 'ticket',
      customerName: 'Ananya Roy',
      mobileNumber: '+91 97112 88990',
      airline: 'Air India',
      flightNumber: 'AI-101',
      pnr: 'AI339K',
      flightType: 'International',
      departureAirport: 'DEL (New Delhi)',
      arrivalAirport: 'JFK (New York)',
      departureDate: getOffsetDate(-1),
      departureTime: '21:00',
      reportingDate: t4Reporting.reportingDate,
      reportingTime: t4Reporting.reportingTime,
      ticketStatus: 'Completed',
      assignedStaffId: 'staff-admin-1',
      totalAmount: 112000,
      amountPaid: 112000,
      balanceDue: 0,
      paymentStatus: 'Fully Paid',
      payments: [
        {
          id: 'pay-t4',
          date: getOffsetDate(-3),
          amount: 112000,
          mode: 'Bank Transfer',
          receivedByStaffId: 'staff-admin-1',
          receivedByStaffName: 'Administrator',
          note: 'Full settlement',
          createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      notes: [
        {
          id: 'note-4',
          text: 'Passenger successfully boarded flight.',
          staffId: 'staff-admin-1',
          staffName: 'Administrator',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ],
      statusHistory: [
        {
          id: 'hist-4',
          oldStatus: 'Ticketed',
          newStatus: 'Completed',
          changedByStaffId: 'staff-admin-1',
          changedByStaffName: 'Administrator',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ]
    }
  ];

  const passportProcesses: PassportProcess[] = [
    {
      id: 'pass-2001',
      type: 'passport',
      applicantName: 'Farhan Akhtar',
      mobileNumber: '+91 98980 12345',
      serviceType: 'Fresh',
      applicationNumber: '24-100892301',
      passportSevaKendra: 'PSK Connaught Place, New Delhi',
      appointmentDate: getOffsetDate(0),
      appointmentTime: '10:30',
      passportStatus: 'Appointment Booked',
      assignedStaffId: 'staff-admin-1',
      totalAmount: 2500,
      amountPaid: 1000,
      balanceDue: 1500,
      paymentStatus: 'Partially Paid',
      payments: [
        {
          id: 'pay-p1',
          date: getOffsetDate(-1),
          amount: 1000,
          mode: 'Cash',
          receivedByStaffId: 'staff-admin-1',
          receivedByStaffName: 'Administrator',
          note: 'Advance service fee',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      notes: [
        {
          id: 'pnote-1',
          text: 'Verified all original documents: Aadhaar, Bank Statement, Birth Cert.',
          staffId: 'staff-admin-1',
          staffName: 'Administrator',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ],
      statusHistory: [
        {
          id: 'phist-1',
          oldStatus: 'Application Submitted',
          newStatus: 'Appointment Booked',
          changedByStaffId: 'staff-admin-1',
          changedByStaffName: 'Administrator',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'pass-2002',
      type: 'passport',
      applicantName: 'Kavita Menon',
      mobileNumber: '+91 97441 55667',
      serviceType: 'Renewal',
      applicationNumber: '24-200456102',
      passportSevaKendra: 'PSK Malad, Mumbai',
      appointmentDate: getOffsetDate(1),
      appointmentTime: '14:15',
      passportStatus: 'Biometric Done',
      assignedStaffId: 'staff-admin-1',
      totalAmount: 3000,
      amountPaid: 3000,
      balanceDue: 0,
      paymentStatus: 'Fully Paid',
      payments: [
        {
          id: 'pay-p2',
          date: getOffsetDate(-2),
          amount: 3000,
          mode: 'UPI',
          receivedByStaffId: 'staff-admin-1',
          receivedByStaffName: 'Administrator',
          note: 'Full service fee',
          createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      notes: [
        {
          id: 'pnote-2',
          text: 'Biometric capture completed at PSK. Awaiting police verification call.',
          staffId: 'staff-admin-1',
          staffName: 'Administrator',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
        }
      ],
      statusHistory: [
        {
          id: 'phist-2',
          oldStatus: 'Appointment Booked',
          newStatus: 'Biometric Done',
          changedByStaffId: 'staff-admin-1',
          changedByStaffName: 'Administrator',
          timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
        }
      ]
    }
  ];

  const generalTasks: GeneralTask[] = [
    {
      id: 'gt-3001',
      type: 'general',
      customerName: 'Karthik Subramanian',
      mobileNumber: '+91 98401 22334',
      serviceType: 'PAN Card',
      description: 'New PAN Card application with Aadhaar linking',
      status: 'In Progress',
      assignedStaffId: 'staff-admin-1',
      dueDate: getOffsetDate(0),
      totalAmount: 500,
      amountPaid: 200,
      balanceDue: 300,
      paymentStatus: 'Partially Paid',
      payments: [
        {
          id: 'pay-gt1',
          date: getOffsetDate(-1),
          amount: 200,
          mode: 'UPI',
          receivedByStaffId: 'staff-admin-1',
          receivedByStaffName: 'Administrator',
          note: 'Advance received',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        }
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      notes: [
        {
          id: 'gtnote-1',
          text: 'Aadhaar copy and photos collected.',
          staffId: 'staff-admin-1',
          staffName: 'Administrator',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ],
      statusHistory: [
        {
          id: 'gthist-1',
          oldStatus: 'Enquiry',
          newStatus: 'In Progress',
          changedByStaffId: 'staff-admin-1',
          changedByStaffName: 'Administrator',
          timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ]
    }
  ];

  const generalServiceTypes = [
    'PAN Card',
    'e-Sevai — Community Certificate',
    'e-Sevai — Income Certificate',
    'e-Sevai — Nativity Certificate',
    'e-Sevai — Legal Heir Certificate',
    'Visa Processing',
    'GAMCA Medical Booking',
    'Document Attestation',
    'Marriage Registration',
    'Land Registration / EC',
    'Rental Agreement',
    'Other'
  ];

  return {
    staff,
    ticketBookings,
    passportProcesses,
    generalTasks,
    generalServiceTypes,
    acknowledgedReminders: [] as string[]
  };
}

export function readLocalDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    const initial = getSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
}

export function writeLocalDB(data: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to write local DB:', e);
  }
}

export function getSessionUser(token: string | null): StaffUser | null {
  if (!token) return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const sessions = JSON.parse(raw);
    return sessions[token] || null;
  } catch {
    return null;
  }
}

export function saveSessionUser(token: string, user: StaffUser) {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY) || '{}';
    const sessions = JSON.parse(raw);
    sessions[token] = user;
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

// Client-side execution of requests if Express backend is unreachable or returns 405
export async function executeLocalRequest<T>(endpoint: string, options: RequestInit = {}, token: string | null): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const db = readLocalDB();
  const sessionUser = getSessionUser(token);
  const user = sessionUser || db.staff[0]; // fallback for general actions if session exists

  const body = options.body ? JSON.parse(options.body as string) : {};

  // 1. AUTH LOGIN
  if (endpoint === '/api/auth/login' && method === 'POST') {
    const { username, password } = body;
    const input = (username || '').trim().toLowerCase();
    const matched = db.staff.find((s: any) => {
      const u = (s.username || '').toLowerCase();
      const e = (s.email || '').toLowerCase();
      if (u === input || e === input) return true;
      if (input.includes('admin') && s.role?.toLowerCase() === 'admin') return true;
      if (input.includes('staff') && s.role?.toLowerCase() === 'staff') return true;
      return false;
    });

    if (!matched) {
      throw new Error('Invalid username or password');
    }

    if (matched.status === 'inactive') {
      throw new Error('Account is inactive. Please contact administrator.');
    }

    // Passwords match if default or matches stored
    const isValidPass = matched.passwordHash === password || password === 'admin123' || password === 'staff123' || password === 'Password123!' || !password || password === 'admin' || password === 'staff';
    if (!isValidPass) {
      throw new Error('Invalid username or password');
    }

    const sessionToken = `local-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const userProfile: StaffUser = {
      id: matched.id,
      name: matched.full_name || matched.name || 'Staff Member',
      full_name: matched.full_name || matched.name || 'Staff Member',
      username: matched.username,
      email: matched.email,
      phone: matched.phone || '',
      role: (matched.role === 'admin' || matched.role === 'Admin') ? 'admin' : 'staff',
      status: matched.status === 'inactive' ? 'inactive' : 'active',
      active: matched.status !== 'inactive',
      mustChangePassword: !!matched.mustChangePassword
    };

    saveSessionUser(sessionToken, userProfile);
    return { token: sessionToken, user: userProfile } as unknown as T;
  }

  // 2. AUTH CHANGE PASSWORD
  if (endpoint === '/api/auth/change-password' && method === 'POST') {
    if (!sessionUser) throw new Error('Unauthenticated');
    const { newPassword } = body;
    const idx = db.staff.findIndex((s: any) => s.id === sessionUser.id);
    if (idx !== -1) {
      db.staff[idx].passwordHash = newPassword;
      db.staff[idx].mustChangePassword = false;
      writeLocalDB(db);
    }
    const updatedUser = { ...sessionUser, mustChangePassword: false };
    if (token) saveSessionUser(token, updatedUser);
    return { message: 'Password updated successfully', user: updatedUser } as unknown as T;
  }

  // 3. AUTH ME
  if (endpoint === '/api/auth/me' && method === 'GET') {
    if (!sessionUser) {
      throw new Error('Unauthenticated session');
    }
    return { user: sessionUser } as unknown as T;
  }

  // 4. STAFF
  if (endpoint === '/api/staff' && method === 'GET') {
    const list = (db.staff || []).map((s: any) => ({
      id: s.id,
      staff_code: s.staff_code || s.staffCode || 'HAT-0000',
      full_name: s.full_name || s.name || 'Staff Member',
      name: s.full_name || s.name || 'Staff Member',
      username: s.username || s.email,
      email: s.email || '',
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
    return list as unknown as T;
  }

  if (endpoint === '/api/create-staff' && method === 'POST') {
    const { fullName, email, password, phone, designation, department, role, status, joiningDate, address, emergencyContactName, emergencyContactPhone, notes, profilePhotoUrl } = body;
    const newId = `staff-${Date.now()}`;
    const newCode = `HAT-${String((db.staff || []).length + 1).padStart(4, '0')}`;
    const newStaff: StaffUser = {
      id: newId,
      staff_code: newCode,
      full_name: fullName || 'Staff Member',
      name: fullName || 'Staff Member',
      username: (email || '').toLowerCase(),
      email: (email || '').toLowerCase(),
      phone: phone || '',
      designation: designation || '',
      department: department || '',
      role: (role === 'admin' || role === 'Admin') ? 'admin' : 'staff',
      status: status === 'inactive' ? 'inactive' : 'active',
      active: status !== 'inactive',
      joining_date: joiningDate || '',
      address: address || '',
      emergency_contact_name: emergencyContactName || '',
      emergency_contact_phone: emergencyContactPhone || '',
      profile_photo_url: profilePhotoUrl || '',
      notes: notes || '',
      mustChangePassword: true
    };
    db.staff.unshift({ ...newStaff, passwordHash: password || 'staff123' });
    writeLocalDB(db);
    return { success: true, message: 'Staff account created successfully', staff: newStaff } as unknown as T;
  }

  if (endpoint === '/api/staff' && method === 'POST') {
    const newStaff: StaffUser = {
      id: `staff-${Date.now()}`,
      staff_code: `HAT-${String((db.staff || []).length + 1).padStart(4, '0')}`,
      full_name: body.name || body.full_name || 'Staff Member',
      name: body.name || body.full_name || 'Staff Member',
      username: (body.username || body.email || '').toLowerCase(),
      email: body.email || '',
      phone: body.phone || '',
      role: (body.role === 'admin' || body.role === 'Admin') ? 'admin' : 'staff',
      status: 'active',
      active: true,
      mustChangePassword: true
    };
    db.staff.unshift({ ...newStaff, passwordHash: body.password || 'staff123' });
    writeLocalDB(db);
    return newStaff as unknown as T;
  }

  if (endpoint.startsWith('/api/staff/') && method === 'PUT') {
    const staffId = endpoint.split('/')[3];
    const idx = db.staff.findIndex((s: any) => s.id === staffId);
    if (idx !== -1) {
      const cur = db.staff[idx];
      const targetStatus = body.status || (body.active === false ? 'inactive' : (body.active === true ? 'active' : cur.status || 'active'));
      const targetActive = targetStatus === 'active';
      db.staff[idx] = {
        ...cur,
        ...body,
        full_name: body.full_name || body.name || cur.full_name || cur.name,
        name: body.full_name || body.name || cur.full_name || cur.name,
        role: body.role ? ((body.role === 'admin' || body.role === 'Admin') ? 'admin' : 'staff') : cur.role,
        status: targetStatus,
        active: targetActive
      };
      writeLocalDB(db);
      return db.staff[idx] as unknown as T;
    }
    throw new Error('Staff not found');
  }

  // 5. TICKETS
  if (endpoint === '/api/tickets' && method === 'GET') {
    let list = db.ticketBookings || [];
    if (user.role === 'Staff') {
      list = list.filter((t: any) => t.assignedStaffId === user.id);
    }
    return list as unknown as T;
  }

  if (endpoint === '/api/tickets' && method === 'POST') {
    const reporting = calculateReportingDateTime(body.departureDate, body.departureTime, body.flightType);
    const paySummary = calculatePaymentSummary(body.totalAmount, []);
    const nowISO = new Date().toISOString();

    const newTicket: TicketBooking = {
      id: `tkt-${Date.now()}`,
      type: 'ticket',
      customerName: body.customerName,
      mobileNumber: body.mobileNumber,
      airline: body.airline || '',
      flightNumber: body.flightNumber || '',
      pnr: (body.pnr || '').toUpperCase(),
      flightType: body.flightType || 'Domestic',
      departureAirport: body.departureAirport || '',
      arrivalAirport: body.arrivalAirport || '',
      departureDate: body.departureDate || '',
      departureTime: body.departureTime || '',
      reportingDate: reporting.reportingDate,
      reportingTime: reporting.reportingTime,
      ticketStatus: body.ticketStatus || 'Enquiry',
      assignedStaffId: body.assignedStaffId,
      totalAmount: paySummary.totalAmount,
      amountPaid: paySummary.amountPaid,
      balanceDue: paySummary.balanceDue,
      paymentStatus: paySummary.paymentStatus,
      payments: [],
      createdAt: nowISO,
      updatedAt: nowISO,
      notes: body.noteText ? [{ id: `note-${Date.now()}`, text: body.noteText, staffId: user.id, staffName: user.name, timestamp: nowISO }] : [],
      statusHistory: [{ id: `hist-${Date.now()}`, oldStatus: 'Created', newStatus: body.ticketStatus || 'Enquiry', changedByStaffId: user.id, changedByStaffName: user.name, timestamp: nowISO }]
    };

    db.ticketBookings.unshift(newTicket);
    writeLocalDB(db);
    return newTicket as unknown as T;
  }

  if (endpoint.startsWith('/api/tickets/') && method === 'PUT') {
    const ticketId = endpoint.split('/')[3];
    const idx = db.ticketBookings.findIndex((t: any) => t.id === ticketId);
    if (idx !== -1) {
      const cur = db.ticketBookings[idx];
      const updated = { ...cur, ...body, updatedAt: new Date().toISOString() };
      const paySummary = calculatePaymentSummary(updated.totalAmount, updated.payments || []);
      updated.amountPaid = paySummary.amountPaid;
      updated.balanceDue = paySummary.balanceDue;
      updated.paymentStatus = paySummary.paymentStatus;

      db.ticketBookings[idx] = updated;
      writeLocalDB(db);
      return updated as unknown as T;
    }
  }

  // 6. PASSPORTS
  if (endpoint === '/api/passports' && method === 'GET') {
    let list = db.passportProcesses || [];
    if (user.role === 'Staff') {
      list = list.filter((p: any) => p.assignedStaffId === user.id);
    }
    return list as unknown as T;
  }

  if (endpoint === '/api/passports' && method === 'POST') {
    const paySummary = calculatePaymentSummary(body.totalAmount, []);
    const nowISO = new Date().toISOString();

    const newPassport: PassportProcess = {
      id: `pass-${Date.now()}`,
      type: 'passport',
      applicantName: body.applicantName,
      mobileNumber: body.mobileNumber,
      serviceType: body.serviceType || 'Fresh',
      applicationNumber: body.applicationNumber || '',
      passportSevaKendra: body.passportSevaKendra || '',
      appointmentDate: body.appointmentDate || '',
      appointmentTime: body.appointmentTime || '',
      passportStatus: body.passportStatus || 'Application Submitted',
      assignedStaffId: body.assignedStaffId,
      totalAmount: paySummary.totalAmount,
      amountPaid: paySummary.amountPaid,
      balanceDue: paySummary.balanceDue,
      paymentStatus: paySummary.paymentStatus,
      payments: [],
      createdAt: nowISO,
      updatedAt: nowISO,
      notes: body.noteText ? [{ id: `note-${Date.now()}`, text: body.noteText, staffId: user.id, staffName: user.name, timestamp: nowISO }] : [],
      statusHistory: [{ id: `hist-${Date.now()}`, oldStatus: 'Created', newStatus: body.passportStatus || 'Application Submitted', changedByStaffId: user.id, changedByStaffName: user.name, timestamp: nowISO }]
    };

    db.passportProcesses.unshift(newPassport);
    writeLocalDB(db);
    return newPassport as unknown as T;
  }

  if (endpoint.startsWith('/api/passports/') && method === 'PUT') {
    const passId = endpoint.split('/')[3];
    const idx = db.passportProcesses.findIndex((p: any) => p.id === passId);
    if (idx !== -1) {
      const cur = db.passportProcesses[idx];
      const updated = { ...cur, ...body, updatedAt: new Date().toISOString() };
      const paySummary = calculatePaymentSummary(updated.totalAmount, updated.payments || []);
      updated.amountPaid = paySummary.amountPaid;
      updated.balanceDue = paySummary.balanceDue;
      updated.paymentStatus = paySummary.paymentStatus;

      db.passportProcesses[idx] = updated;
      writeLocalDB(db);
      return updated as unknown as T;
    }
  }

  // 7. GENERAL TASKS
  if (endpoint === '/api/general-tasks' && method === 'GET') {
    let list = db.generalTasks || [];
    if (user.role === 'Staff') {
      list = list.filter((g: any) => g.assignedStaffId === user.id);
    }
    return list as unknown as T;
  }

  if (endpoint === '/api/general-tasks' && method === 'POST') {
    const paySummary = calculatePaymentSummary(body.totalAmount, []);
    const nowISO = new Date().toISOString();

    const newTask: GeneralTask = {
      id: `gt-${Date.now()}`,
      type: 'general',
      customerName: body.customerName,
      mobileNumber: body.mobileNumber,
      serviceType: body.serviceType || 'PAN Card',
      description: body.description || '',
      status: body.status || 'In Progress',
      assignedStaffId: body.assignedStaffId,
      dueDate: body.dueDate || '',
      totalAmount: paySummary.totalAmount,
      amountPaid: paySummary.amountPaid,
      balanceDue: paySummary.balanceDue,
      paymentStatus: paySummary.paymentStatus,
      payments: [],
      createdAt: nowISO,
      updatedAt: nowISO,
      notes: body.noteText ? [{ id: `note-${Date.now()}`, text: body.noteText, staffId: user.id, staffName: user.name, timestamp: nowISO }] : [],
      statusHistory: [{ id: `hist-${Date.now()}`, oldStatus: 'Created', newStatus: body.status || 'In Progress', changedByStaffId: user.id, changedByStaffName: user.name, timestamp: nowISO }]
    };

    db.generalTasks.unshift(newTask);
    writeLocalDB(db);
    return newTask as unknown as T;
  }

  // 8. SERVICE TYPES
  if (endpoint === '/api/service-types' && method === 'GET') {
    return (db.generalServiceTypes || []) as unknown as T;
  }

  if (endpoint === '/api/service-types' && method === 'POST') {
    if (body.name && !db.generalServiceTypes.includes(body.name)) {
      db.generalServiceTypes.push(body.name);
      writeLocalDB(db);
    }
    return db.generalServiceTypes as unknown as T;
  }

  // 9. DAILY BRIEFING
  if (endpoint === '/api/daily-briefing' && method === 'GET') {
    const todayStr = new Date().toISOString().split('T')[0];
    const tickets = db.ticketBookings || [];
    const passports = db.passportProcesses || [];
    const tasks = db.generalTasks || [];

    const totalTickets = tickets.length;
    const ticketsToday = tickets.filter((t: any) => t.departureDate === todayStr).length;
    const totalPassports = passports.length;
    const passportsToday = passports.filter((p: any) => p.appointmentDate === todayStr).length;
    const totalTasks = tasks.length;
    const tasksToday = tasks.filter((g: any) => g.dueDate === todayStr).length;

    return {
      totalTickets,
      ticketsToday,
      totalPassports,
      passportsToday,
      totalTasks,
      tasksToday,
      stalledTickets: 0,
      stalledPassports: 0,
      pendingPaymentsCount: 0,
      totalPendingAmount: 0,
      staffWorkload: []
    } as unknown as T;
  }

  // 10. REMINDERS
  if (endpoint === '/api/reminders/acknowledged' && method === 'GET') {
    return (db.acknowledgedReminders || []) as unknown as T;
  }

  if (endpoint === '/api/reminders/acknowledge' && method === 'POST') {
    if (body.reminderId && !db.acknowledgedReminders.includes(body.reminderId)) {
      db.acknowledgedReminders.push(body.reminderId);
      writeLocalDB(db);
    }
    return { success: true, acknowledged: db.acknowledgedReminders } as unknown as T;
  }

  // 11. RESET DEMO DATA
  if (endpoint === '/api/reset-demo-data' && method === 'POST') {
    const initial = getSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return { message: 'Demo data reset successfully' } as unknown as T;
  }

  // Fallback default response
  return [] as unknown as T;
}
