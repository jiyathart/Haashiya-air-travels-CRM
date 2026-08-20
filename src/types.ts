export type UserRole = 'Admin' | 'Staff' | 'Manager' | 'Agent' | 'admin' | 'staff';

export interface StaffUser {
  id: string;
  auth_user_id?: string;
  staff_code?: string;
  full_name?: string;
  name?: string;
  username?: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  role: 'admin' | 'staff' | 'Admin' | 'Staff';
  active?: boolean;
  status: 'active' | 'inactive';
  agentCode?: string;
  mustChangePassword?: boolean;
  joining_date?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  profile_photo_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  assignedTaskCount?: number;
}

export interface Agent {
  id: string;
  agent_id: string; // e.g. AGT-0001
  full_name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'agent';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
}

export interface Customer {
  id: string;
  agent_id?: string | null;
  agent_code?: string;
  agent_name?: string;
  name: string;
  mobile_number: string;
  email?: string;
  address?: string;
  passport_number?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
}

export interface Enquiry {
  id: string;
  agent_id?: string | null;
  agent_code?: string;
  agent_name?: string;
  customer_name: string;
  mobile_number: string;
  service_type: string;
  description?: string;
  status: 'New' | 'In Progress' | 'Followed Up' | 'Converted' | 'Closed';
  expected_date?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
}

export interface Expense {
  id: string;
  agent_id?: string | null;
  agent_code?: string;
  agent_name?: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_mode: PaymentMode;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
}

export interface FollowUp {
  id: string;
  agent_id?: string | null;
  agent_code?: string;
  agent_name?: string;
  customer_name: string;
  mobile_number: string;
  booking_id?: string | null;
  enquiry_id?: string | null;
  title: string;
  notes?: string;
  scheduled_at: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
}

export interface DeletedRecord {
  id: string;
  table_name: 'agents' | 'customers' | 'enquiries' | 'bookings' | 'payments' | 'expenses' | 'follow_ups';
  record_title: string;
  record_subtitle?: string;
  assigned_agent_name?: string;
  deleted_at: string;
  deleted_by?: string;
  delete_reason?: string;
  original_data?: any;
}

export interface ActivityLog {
  id: string;
  staff_id?: string;
  staff_name?: string;
  task_id?: string;
  task_title?: string;
  action: string;
  old_status?: string;
  new_status?: string;
  note?: string;
  created_at: string;
}

export type TicketStatus = 'Enquiry' | 'Confirmed' | 'Ticketed' | 'Completed' | 'Cancelled';

export type FlightType = 'Domestic' | 'International';

export type PassportServiceType = 'Fresh' | 'Renewal' | 'Tatkal';

export type PassportStatus = 
  | 'Application Submitted'
  | 'Appointment Booked'
  | 'Biometric Done'
  | 'Police Verification'
  | 'Printing'
  | 'Dispatched'
  | 'Delivered';

export type GeneralTaskStatus = 
  | 'Enquiry'
  | 'In Progress'
  | 'Submitted / Awaiting Approval'
  | 'Ready / Completed'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card';

export type PaymentStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid';

export interface PaymentEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  mode: PaymentMode;
  receivedByStaffId: string;
  receivedByStaffName: string;
  note?: string;
  createdAt: string;
}

export interface NoteEntry {
  id: string;
  text: string;
  staffId: string;
  staffName: string;
  timestamp: string;
}

export interface StatusLogEntry {
  id: string;
  oldStatus: string;
  newStatus: string;
  changedByStaffId: string;
  changedByStaffName: string;
  timestamp: string;
}

export interface TicketBooking {
  id: string;
  type: 'ticket';
  customerName: string;
  mobileNumber: string;
  airline: string;
  flightNumber: string;
  pnr: string;
  flightType: FlightType;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm
  reportingDate: string; // YYYY-MM-DD (Auto calculated)
  reportingTime: string; // HH:mm (Auto calculated)
  ticketStatus: TicketStatus;
  assignedStaffId: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  payments: PaymentEntry[];
  createdAt: string;
  updatedAt: string;
  notes: NoteEntry[];
  statusHistory: StatusLogEntry[];
}

export interface PassportProcess {
  id: string;
  type: 'passport';
  applicantName: string;
  mobileNumber: string;
  serviceType: PassportServiceType;
  applicationNumber: string;
  passportSevaKendra: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  passportStatus: PassportStatus;
  assignedStaffId: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  payments: PaymentEntry[];
  createdAt: string;
  updatedAt: string;
  notes: NoteEntry[];
  statusHistory: StatusLogEntry[];
}

export interface GeneralTask {
  id: string;
  type?: 'general';
  title?: string;
  customerName?: string;
  mobileNumber?: string;
  serviceType?: string;
  description?: string;
  status: GeneralTaskStatus | string;
  assignedStaffId?: string;
  assigned_staff_id?: string;
  assignedStaffName?: string;
  adminNote?: string;
  admin_note?: string;
  staffUpdateNote?: string;
  staff_update_note?: string;
  dueDate?: string; // YYYY-MM-DD
  due_date?: string;
  totalAmount?: number;
  amountPaid?: number;
  balanceDue?: number;
  paymentStatus?: PaymentStatus;
  payments?: PaymentEntry[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  completedAt?: string;
  completed_at?: string;
  notes?: NoteEntry[];
  statusHistory?: StatusLogEntry[];
}

export type ReminderCategory = 'Today' | 'Tomorrow' | 'Upcoming' | 'Overdue' | 'Stalled';

export interface ReminderItem {
  id: string;
  bookingType: 'ticket' | 'passport' | 'general';
  bookingId: string;
  title: string;
  subtitle: string;
  targetDate: string; // YYYY-MM-DD
  targetTime?: string;
  category: ReminderCategory;
  assignedStaffId: string;
  assignedStaffName: string;
  isAcknowledged: boolean;
  alertReason: string;
  severity: 'high' | 'medium' | 'low';
}

export interface WorkloadSummary {
  staffId: string;
  staffName: string;
  ticketCount: number;
  passportCount: number;
  generalTaskCount: number;
  totalActiveCount: number;
}

export interface DailyBriefingScheduleItem {
  id: string;
  bookingType: 'ticket' | 'passport' | 'general';
  customerName: string;
  serviceOrFlight: string;
  time?: string;
  assignedStaffId: string;
  assignedStaffName: string;
  status: string;
}

export interface DailyBriefingOverdueStaffItem {
  staffId: string;
  staffName: string;
  overdueCount: number;
  stalledCount: number;
}

export interface DailyBriefingCompletedItem {
  id: string;
  bookingType: 'ticket' | 'passport' | 'general';
  customerName: string;
  serviceOrFlight: string;
  completedAt: string;
  assignedStaffName: string;
}

export interface DailyBriefingData {
  date: string;
  userRole: UserRole;
  userName: string;
  userId: string;
  // Schedule today
  todaySchedule: DailyBriefingScheduleItem[];
  // Reminders / overdue
  dueReminders: ReminderItem[];
  // Pending payment count
  pendingPaymentCount: number;
  pendingPaymentAmount: number;
  // Yesterday's completed summary
  yesterdayCompletedCount: number;
  yesterdayCompletedItems: DailyBriefingCompletedItem[];
  // Admin aggregated fields
  newEnquiriesLast24h?: number;
  overdueByStaff?: DailyBriefingOverdueStaffItem[];
  workloadSnapshot?: WorkloadSummary[];
}

export type DailyBriefing = DailyBriefingData;
export type ReminderAlert = ReminderItem;
