import React, { useState, useEffect, useCallback } from 'react';
import { StaffUser, TicketBooking, PassportProcess, GeneralTask, TicketStatus, PassportStatus, GeneralTaskStatus, PaymentMode, DailyBriefing, Agent, Customer, Enquiry, Expense, FollowUp } from './types';
import { api, getToken, clearToken } from './api';
import { generateReminders } from './utils/dateUtils';
import { supabaseService } from './lib/supabaseService';
import { authService } from './lib/authService';

// Components
import { Header, ActiveTabType } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { StaffTaskDashboard } from './components/StaffTaskDashboard';
import { AdminStaffUpdatesPanel } from './components/AdminStaffUpdatesPanel';
import { AuthCard } from './components/AuthCard';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { AdminWorkloadCard } from './components/AdminWorkloadCard';
import { BookingList } from './components/BookingList';
import { TicketBookingModal } from './components/TicketBookingModal';
import { PassportProcessModal } from './components/PassportProcessModal';
import { GeneralTaskModal } from './components/GeneralTaskModal';
import { DailyBriefingModal } from './components/DailyBriefingModal';
import { RemindersDrawer } from './components/RemindersDrawer';
import { StaffManagementModal } from './components/StaffManagementModal';
import { PaymentManagementModal } from './components/PaymentManagementModal';
import { PaymentDashboard } from './components/PaymentDashboard';
import { AgentManagement } from './components/AgentManagement';
import { CustomerManagement } from './components/CustomerManagement';
import { EnquiryManagement } from './components/EnquiryManagement';
import { ExpenseManagement } from './components/ExpenseManagement';
import { FollowUpManagement } from './components/FollowUpManagement';
import { DeletedRecordsPage } from './components/DeletedRecordsPage';
import { SupabaseSetupGuide } from './components/SupabaseSetupGuide';
import { AdminProfileView } from './components/AdminProfileView';
import { Loader2, Plane } from 'lucide-react';

export default function App() {
  const [authenticatedUser, setAuthenticatedUser] = useState<StaffUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Core CRM Data State
  const [tickets, setTickets] = useState<TicketBooking[]>([]);
  const [passports, setPassports] = useState<PassportProcess[]>([]);
  const [generalTasks, setGeneralTasks] = useState<GeneralTask[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);

  // Supabase Entities
  const [agents, setAgents] = useState<Agent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);

  // Daily Briefing State
  const [dailyBriefingData, setDailyBriefingData] = useState<DailyBriefing | null>(null);
  const [isDailyBriefingOpen, setIsDailyBriefingOpen] = useState(false);

  // Navigation & UI View Tabs
  const [activeTab, setActiveTab] = useState<ActiveTabType>('dashboard');
  const [staffFilter, setStaffFilter] = useState<string | undefined>(undefined);

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isForcePassword, setIsForcePassword] = useState(false);
  
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<TicketBooking | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const [selectedPassport, setSelectedPassport] = useState<PassportProcess | null>(null);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);

  const [selectedGeneralTask, setSelectedGeneralTask] = useState<GeneralTask | null>(null);
  const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);

  const [selectedPaymentBooking, setSelectedPaymentBooking] = useState<TicketBooking | PassportProcess | GeneralTask | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch Data Routine
  const refreshData = useCallback(async () => {
    try {
      const [tkts, pssports, gnrl, stypes, apiStf, spStf, acks, custs, enqs, exps, fups] = await Promise.all([
        api.getTickets().catch(() => []),
        api.getPassports().catch(() => []),
        supabaseService.getGeneralTasks().catch(() => []),
        api.getServiceTypes().catch(() => []),
        api.getStaff().catch(() => []),
        supabaseService.getStaff().catch(() => []),
        api.getAcknowledgedReminders().catch(() => []),
        supabaseService.getCustomers().catch(() => []),
        supabaseService.getEnquiries().catch(() => []),
        supabaseService.getExpenses().catch(() => []),
        supabaseService.getFollowUps().catch(() => [])
      ]);

      // Combine and merge staff from API and Supabase
      const staffMap = new Map<string, StaffUser>();
      for (const s of apiStf || []) {
        if (!s) continue;
        const key = s.id || s.email || s.username;
        if (key) staffMap.set(key, s);
      }
      for (const s of spStf || []) {
        if (!s) continue;
        const key = s.id || s.email || s.username;
        if (!key) continue;
        if (staffMap.has(key)) {
          staffMap.set(key, { ...staffMap.get(key)!, ...s });
        } else {
          staffMap.set(key, s);
        }
      }

      setTickets(tkts);
      setPassports(pssports);
      setGeneralTasks(gnrl);
      setServiceTypes(stypes);
      setStaffList(Array.from(staffMap.values()));
      setAcknowledgedIds(acks);
      setCustomers(custs);
      setEnquiries(enqs);
      setExpenses(exps);
      setFollowUps(fups);
    } catch (err) {
      console.error('Error loading CRM data:', err);
    }
  }, []);

  // Daily Briefing Fetcher
  const loadDailyBriefing = useCallback(async () => {
    try {
      const briefing = await api.getDailyBriefing();
      setDailyBriefingData(briefing);
      setIsDailyBriefingOpen(true);
    } catch (err) {
      console.error('Error fetching daily briefing:', err);
    }
  }, []);

  // Initial Auth Verification
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.getCurrentSession();
        if (user && user.active !== false && user.status !== 'inactive') {
          setAuthenticatedUser(user);
          await refreshData();
          if (user.role === 'admin' || user.role === 'Admin') {
            loadDailyBriefing();
          }
        } else {
          setAuthenticatedUser(null);
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
        setAuthenticatedUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();
  }, [refreshData, loadDailyBriefing]);

  // Handle Logout
  const handleLogout = async () => {
    await authService.signOut();
    setAuthenticatedUser(null);
  };

  // Handle Password Change
  const handleChangePassword = async (currentPass: string, newPass: string) => {
    const res = await api.changePassword(currentPass, newPass);
    setAuthenticatedUser(res.user);
    setIsForcePassword(false);
    setIsPasswordModalOpen(false);
  };

  // Ticket Operations
  const handleSaveTicket = async (data: Partial<TicketBooking> & { noteText?: string }) => {
    if (data.id) {
      await api.updateTicket(data.id, data);
      if (data.noteText) {
        await api.addTicketNote(data.id, data.noteText);
      }
    } else {
      await api.createTicket(data);
    }
    await refreshData();
  };

  const handleQuickReassignTicket = async (ticketId: string, newStaffId: string) => {
    await api.updateTicket(ticketId, { assignedStaffId: newStaffId });
    await refreshData();
  };

  const handleQuickStatusTicket = async (ticketId: string, ticketStatus: TicketStatus) => {
    await api.updateTicket(ticketId, { ticketStatus });
    await refreshData();
  };

  // Passport Operations
  const handleSavePassport = async (data: Partial<PassportProcess> & { noteText?: string }) => {
    if (data.id) {
      await api.updatePassport(data.id, data);
      if (data.noteText) {
        await api.addPassportNote(data.id, data.noteText);
      }
    } else {
      await api.createPassport(data);
    }
    await refreshData();
  };

  const handleQuickReassignPassport = async (passportId: string, newStaffId: string) => {
    await api.updatePassport(passportId, { assignedStaffId: newStaffId });
    await refreshData();
  };

  const handleQuickStatusPassport = async (passportId: string, passportStatus: PassportStatus) => {
    await api.updatePassport(passportId, { passportStatus });
    await refreshData();
  };

  // General Task Operations
  const handleSaveGeneralTask = async (data: Partial<GeneralTask> & { noteText?: string }) => {
    if (data.id) {
      await api.updateGeneralTask(data.id, data);
      if (data.noteText) {
        await api.addGeneralTaskNote(data.id, data.noteText);
      }
    } else {
      await api.createGeneralTask(data);
    }
    await refreshData();
  };

  const handleQuickReassignGeneralTask = async (taskId: string, newStaffId: string) => {
    await api.updateGeneralTask(taskId, { assignedStaffId: newStaffId });
    await refreshData();
  };

  const handleQuickStatusGeneralTask = async (taskId: string, status: GeneralTaskStatus) => {
    await api.updateGeneralTask(taskId, { status });
    await refreshData();
  };

  const handleAddServiceType = async (typeLabel: string) => {
    const updated = await api.addServiceType(typeLabel);
    setServiceTypes(updated);
  };

  // Payment Modal Operations
  const handleOpenPaymentModal = (booking: TicketBooking | PassportProcess | GeneralTask) => {
    setSelectedPaymentBooking(booking);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentAdded = async (
    bookingId: string,
    bookingType: 'ticket' | 'passport' | 'general',
    paymentData: { date: string; amount: number; mode: PaymentMode; note?: string }
  ) => {
    let updated: TicketBooking | PassportProcess | GeneralTask;
    if (bookingType === 'ticket') {
      updated = await api.addTicketPayment(bookingId, paymentData);
    } else if (bookingType === 'passport') {
      updated = await api.addPassportPayment(bookingId, paymentData);
    } else {
      updated = await api.addGeneralTaskPayment(bookingId, paymentData);
    }
    setSelectedPaymentBooking(updated);
    await refreshData();
  };

  const handlePaymentUpdated = async (
    bookingId: string,
    bookingType: 'ticket' | 'passport' | 'general',
    paymentId: string,
    paymentData: { date?: string; amount?: number; mode?: PaymentMode; note?: string }
  ) => {
    let updated: TicketBooking | PassportProcess | GeneralTask;
    if (bookingType === 'ticket') {
      updated = await api.updateTicketPayment(bookingId, paymentId, paymentData);
    } else if (bookingType === 'passport') {
      updated = await api.updatePassportPayment(bookingId, paymentId, paymentData);
    } else {
      updated = await api.updateGeneralTaskPayment(bookingId, paymentId, paymentData);
    }
    setSelectedPaymentBooking(updated);
    await refreshData();
  };

  const handlePaymentDeleted = async (
    bookingId: string,
    bookingType: 'ticket' | 'passport' | 'general',
    paymentId: string
  ) => {
    let updated: TicketBooking | PassportProcess | GeneralTask;
    if (bookingType === 'ticket') {
      updated = await api.deleteTicketPayment(bookingId, paymentId);
    } else if (bookingType === 'passport') {
      updated = await api.deletePassportPayment(bookingId, paymentId);
    } else {
      updated = await api.deleteGeneralTaskPayment(bookingId, paymentId);
    }
    setSelectedPaymentBooking(updated);
    await refreshData();
  };

  const handleTotalAmountUpdated = async (
    bookingId: string,
    bookingType: 'ticket' | 'passport' | 'general',
    totalAmount: number
  ) => {
    if (bookingType === 'ticket') {
      const updated = await api.updateTicket(bookingId, { totalAmount });
      setSelectedPaymentBooking(updated);
    } else if (bookingType === 'passport') {
      const updated = await api.updatePassport(bookingId, { totalAmount });
      setSelectedPaymentBooking(updated);
    } else {
      const updated = await api.updateGeneralTask(bookingId, { totalAmount });
      setSelectedPaymentBooking(updated);
    }
    await refreshData();
  };

  // Staff Operations
  const handleCreateStaff = async (data: Partial<StaffUser> & { password: string }) => {
    try {
      await supabaseService.createStaff({
        fullName: data.name || data.full_name,
        username: data.username || data.email,
        email: data.email || `${data.username}@haashiyatravels.com`,
        password: data.password,
        phone: data.phone,
        role: (data.role?.toLowerCase() === 'admin' || data.role === 'Admin') ? 'admin' : 'staff',
        status: data.status || 'active'
      });
    } catch (err) {
      console.warn("Supabase staff creation notice, falling back to API:", err);
      await api.createStaff(data);
    }
    await refreshData();
  };

  const handleUpdateStaff = async (id: string, data: Partial<StaffUser> & { resetPassword?: string }) => {
    try {
      await supabaseService.updateStaff(id, data);
    } catch {
      await api.updateStaff(id, data);
    }
    await refreshData();
  };

  // Reminder Operations
  const handleAcknowledgeReminder = async (reminderId: string) => {
    const res = await api.acknowledgeReminder(reminderId);
    setAcknowledgedIds(res.acknowledged);
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    if (window.confirm('Reset database to initial sample tickets, passport cases, and staff accounts?')) {
      await api.resetDemoData();
      await refreshData();
    }
  };

  const currentUser = authenticatedUser || {
    id: 'guest',
    name: 'Guest',
    email: '',
    role: 'staff',
    status: 'inactive'
  } as StaffUser;

  // Generated Reminders
  const allReminders = generateReminders(tickets, passports, generalTasks, staffList, acknowledgedIds);
  const unreadRemindersCount = (currentUser.role === 'Admin' || currentUser.role === 'admin'
    ? allReminders
    : allReminders.filter(r => r.assignedStaffId === currentUser.id)
  ).filter(r => !r.isAcknowledged).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">Connecting to Haashiya Air Travels CRM...</p>
      </div>
    );
  }

  // UNAUTHENTICATED ROUTE: ALWAYS SHOW LOGIN PAGE FIRST
  if (!authenticatedUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setAuthenticatedUser(user);
          refreshData();
          if (user.role === 'admin' || user.role === 'Admin') {
            loadDailyBriefing();
          }
        }}
      />
    );
  }

  // STAFF ROLE ROUTE: SHOW STAFF TASK DASHBOARD
  if (authenticatedUser.role === 'staff' || authenticatedUser.role === 'Staff') {
    return (
      <StaffTaskDashboard
        currentUser={authenticatedUser}
        onLogout={handleLogout}
      />
    );
  }

  // ADMIN ROLE ROUTE: FULL CRM DASHBOARD
  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans">
      
      {/* Navigation Header */}
      <Header
        currentUser={currentUser}
        unreadRemindersCount={unreadRemindersCount}
        onOpenReminders={() => setIsRemindersOpen(true)}
        onOpenDailyBriefing={() => setIsDailyBriefingOpen(true)}
        onChangePassword={() => {
          setIsForcePassword(false);
          setIsPasswordModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenAuthCard={() => setIsAuthModalOpen(true)}
        onResetDemo={(currentUser.role === 'Admin' || currentUser.role === 'admin') ? handleResetDemo : undefined}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        
        {/* Dashboard View Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <AdminWorkloadCard
              tickets={tickets}
              passports={passports}
              staffList={staffList}
              onSelectStaffFilter={(sId) => {
                setStaffFilter(sId);
                setActiveTab('tickets');
              }}
              onOpenNewTicketModal={() => {
                setSelectedTicket(null);
                setIsTicketModalOpen(true);
              }}
              onOpenNewPassportModal={() => {
                setSelectedPassport(null);
                setIsPassportModalOpen(true);
              }}
            />

            {/* Admin Live Staff Updates Panel */}
            <AdminStaffUpdatesPanel />

            <div className="pt-2">
              <h3 className="text-base font-bold text-slate-900 mb-3">
                {currentUser.role === 'Admin' ? 'All Live Work & Services' : 'My Assigned Work'}
              </h3>
              <BookingList
                tickets={currentUser.role === 'Admin' ? tickets : tickets.filter(t => t.assignedStaffId === currentUser.id)}
                passports={currentUser.role === 'Admin' ? passports : passports.filter(p => p.assignedStaffId === currentUser.id)}
                generalTasks={currentUser.role === 'Admin' ? generalTasks : generalTasks.filter(g => g.assignedStaffId === currentUser.id)}
                staffList={staffList}
                currentUser={currentUser}
                selectedStaffFilter={staffFilter}
                onOpenTicket={(t) => {
                  setSelectedTicket(t);
                  setIsTicketModalOpen(true);
                }}
                onOpenPassport={(p) => {
                  setSelectedPassport(p);
                  setIsPassportModalOpen(true);
                }}
                onOpenGeneralTask={(g) => {
                  setSelectedGeneralTask(g);
                  setIsGeneralModalOpen(true);
                }}
                onOpenPaymentModal={handleOpenPaymentModal}
                onQuickReassignTicket={handleQuickReassignTicket}
                onQuickReassignPassport={handleQuickReassignPassport}
                onQuickReassignGeneralTask={handleQuickReassignGeneralTask}
                onQuickStatusTicket={handleQuickStatusTicket}
                onQuickStatusPassport={handleQuickStatusPassport}
                onQuickStatusGeneralTask={handleQuickStatusGeneralTask}
                onOpenNewTicketModal={() => {
                  setSelectedTicket(null);
                  setIsTicketModalOpen(true);
                }}
                onOpenNewPassportModal={() => {
                  setSelectedPassport(null);
                  setIsPassportModalOpen(true);
                }}
                onOpenNewGeneralModal={() => {
                  setSelectedGeneralTask(null);
                  setIsGeneralModalOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Flight Ticket Bookings</h2>
                <p className="text-xs text-slate-500">Manage flight departures, PNRs, and auto-calculated reporting times.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setIsTicketModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow"
              >
                + New Ticket Booking
              </button>
            </div>

            <BookingList
              tickets={currentUser.role === 'Admin' ? tickets : tickets.filter(t => t.assignedStaffId === currentUser.id)}
              passports={[]}
              generalTasks={[]}
              staffList={staffList}
              currentUser={currentUser}
              selectedStaffFilter={staffFilter}
              onOpenTicket={(t) => {
                setSelectedTicket(t);
                setIsTicketModalOpen(true);
              }}
              onOpenPassport={() => {}}
              onOpenGeneralTask={() => {}}
              onOpenPaymentModal={handleOpenPaymentModal}
              onQuickReassignTicket={handleQuickReassignTicket}
              onQuickReassignPassport={handleQuickReassignPassport}
              onQuickReassignGeneralTask={handleQuickReassignGeneralTask}
              onQuickStatusTicket={handleQuickStatusTicket}
              onQuickStatusPassport={handleQuickStatusPassport}
              onQuickStatusGeneralTask={handleQuickStatusGeneralTask}
              onOpenNewTicketModal={() => {
                setSelectedTicket(null);
                setIsTicketModalOpen(true);
              }}
              onOpenNewPassportModal={() => {
                setSelectedPassport(null);
                setIsPassportModalOpen(true);
              }}
              onOpenNewGeneralModal={() => {
                setSelectedGeneralTask(null);
                setIsGeneralModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Passports Tab */}
        {activeTab === 'passports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Passport Application Cases</h2>
                <p className="text-xs text-slate-500">Track PSK appointments, biometric status, and police verification.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedPassport(null);
                  setIsPassportModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold text-xs rounded-xl shadow"
              >
                + New Passport Application
              </button>
            </div>

            <BookingList
              tickets={[]}
              passports={currentUser.role === 'Admin' ? passports : passports.filter(p => p.assignedStaffId === currentUser.id)}
              generalTasks={[]}
              staffList={staffList}
              currentUser={currentUser}
              selectedStaffFilter={staffFilter}
              onOpenTicket={() => {}}
              onOpenPassport={(p) => {
                setSelectedPassport(p);
                setIsPassportModalOpen(true);
              }}
              onOpenGeneralTask={() => {}}
              onOpenPaymentModal={handleOpenPaymentModal}
              onQuickReassignTicket={handleQuickReassignTicket}
              onQuickReassignPassport={handleQuickReassignPassport}
              onQuickReassignGeneralTask={handleQuickReassignGeneralTask}
              onQuickStatusTicket={handleQuickStatusTicket}
              onQuickStatusPassport={handleQuickStatusPassport}
              onQuickStatusGeneralTask={handleQuickStatusGeneralTask}
              onOpenNewTicketModal={() => {
                setSelectedTicket(null);
                setIsTicketModalOpen(true);
              }}
              onOpenNewPassportModal={() => {
                setSelectedPassport(null);
                setIsPassportModalOpen(true);
              }}
              onOpenNewGeneralModal={() => {
                setSelectedGeneralTask(null);
                setIsGeneralModalOpen(true);
              }}
            />
          </div>
        )}

        {/* General Tasks / e-Sevai Tab */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">e-Sevai & General Services</h2>
                <p className="text-xs text-slate-500">Pan card, Aadhaar updates, voter IDs, certificates, and miscellaneous customer tasks.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedGeneralTask(null);
                  setIsGeneralModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-xl shadow"
              >
                + New e-Sevai / Service Task
              </button>
            </div>

            <BookingList
              tickets={[]}
              passports={[]}
              generalTasks={currentUser.role === 'Admin' ? generalTasks : generalTasks.filter(g => g.assignedStaffId === currentUser.id)}
              staffList={staffList}
              currentUser={currentUser}
              selectedStaffFilter={staffFilter}
              onOpenTicket={() => {}}
              onOpenPassport={() => {}}
              onOpenGeneralTask={(g) => {
                setSelectedGeneralTask(g);
                setIsGeneralModalOpen(true);
              }}
              onOpenPaymentModal={handleOpenPaymentModal}
              onQuickReassignTicket={handleQuickReassignTicket}
              onQuickReassignPassport={handleQuickReassignPassport}
              onQuickReassignGeneralTask={handleQuickReassignGeneralTask}
              onQuickStatusTicket={handleQuickStatusTicket}
              onQuickStatusPassport={handleQuickStatusPassport}
              onQuickStatusGeneralTask={handleQuickStatusGeneralTask}
              onOpenNewTicketModal={() => {
                setSelectedTicket(null);
                setIsTicketModalOpen(true);
              }}
              onOpenNewPassportModal={() => {
                setSelectedPassport(null);
                setIsPassportModalOpen(true);
              }}
              onOpenNewGeneralModal={() => {
                setSelectedGeneralTask(null);
                setIsGeneralModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <PaymentDashboard
            tickets={currentUser.role === 'Admin' ? tickets : tickets.filter(t => t.assignedStaffId === currentUser.id)}
            passports={currentUser.role === 'Admin' ? passports : passports.filter(p => p.assignedStaffId === currentUser.id)}
            generalTasks={currentUser.role === 'Admin' ? generalTasks : generalTasks.filter(g => g.assignedStaffId === currentUser.id)}
            staffList={staffList}
            onSelectBooking={handleOpenPaymentModal}
          />
        )}

        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">System Reminders & Stalled Work Alerts</h2>
                <p className="text-xs text-slate-500">Automated alerts for flight reporting, PSK appointments, and 3+ day stalled cases.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <RemindersDrawer
                isOpen={true}
                reminders={allReminders}
                currentUser={currentUser}
                onClose={() => setActiveTab('dashboard')}
                onAcknowledge={handleAcknowledgeReminder}
                onSelectBooking={(type, id) => {
                  if (type === 'ticket') {
                    const t = tickets.find(tk => tk.id === id);
                    if (t) {
                      setSelectedTicket(t);
                      setIsTicketModalOpen(true);
                    }
                  } else if (type === 'passport') {
                    const p = passports.find(ps => ps.id === id);
                    if (p) {
                      setSelectedPassport(p);
                      setIsPassportModalOpen(true);
                    }
                  } else {
                    const g = generalTasks.find(gt => gt.id === id);
                    if (g) {
                      setSelectedGeneralTask(g);
                      setIsGeneralModalOpen(true);
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Staff Management Tab */}
        {(activeTab === 'staff' || activeTab === 'agents') && (
          <AgentManagement
            staffList={staffList}
            currentUser={currentUser}
            userRole={currentUser.role}
            onRefresh={refreshData}
          />
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <CustomerManagement
            customers={customers}
            agents={agents}
            userRole={currentUser.role}
            onRefresh={refreshData}
          />
        )}

        {/* Enquiries Tab */}
        {activeTab === 'enquiries' && (
          <EnquiryManagement
            enquiries={enquiries}
            agents={agents}
            userRole={currentUser.role}
            onRefresh={refreshData}
          />
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <ExpenseManagement
            expenses={expenses}
            agents={agents}
            userRole={currentUser.role}
            onRefresh={refreshData}
          />
        )}

        {/* Follow-ups Tab */}
        {activeTab === 'follow_ups' && (
          <FollowUpManagement
            followUps={followUps}
            agents={agents}
            staffList={staffList}
            userRole={currentUser.role}
            onRefresh={refreshData}
          />
        )}

        {/* Deleted Records Trash Archive (Admin Only) */}
        {activeTab === 'deleted' && (
          <DeletedRecordsPage
            userRole={currentUser.role}
            onRefreshParent={refreshData}
          />
        )}

        {/* Admin Profile */}
        {activeTab === 'profile' && (
          <div className="py-6">
            <AdminProfileView
              currentUser={currentUser}
              onRefresh={refreshData}
            />
          </div>
        )}

        {/* Supabase Setup & SQL Guide */}
        {activeTab === 'setup' && (
          <SupabaseSetupGuide />
        )}

      </main>

      {/* MODALS */}

      {/* Daily Briefing Modal */}
      {dailyBriefingData && (
        <DailyBriefingModal
          isOpen={isDailyBriefingOpen}
          currentUser={currentUser}
          briefing={dailyBriefingData}
          reminders={allReminders}
          staffList={staffList}
          onClose={() => setIsDailyBriefingOpen(false)}
          onNavigateToRecord={(type, id) => {
            setIsDailyBriefingOpen(false);
            if (type === 'ticket') {
              const t = tickets.find(tk => tk.id === id);
              if (t) { setSelectedTicket(t); setIsTicketModalOpen(true); }
            } else if (type === 'passport') {
              const p = passports.find(ps => ps.id === id);
              if (p) { setSelectedPassport(p); setIsPassportModalOpen(true); }
            } else {
              const g = generalTasks.find(gt => gt.id === id);
              if (g) { setSelectedGeneralTask(g); setIsGeneralModalOpen(true); }
            }
          }}
        />
      )}

      {/* General Task Modal */}
      <GeneralTaskModal
        isOpen={isGeneralModalOpen}
        task={selectedGeneralTask}
        staffList={staffList}
        currentUser={currentUser}
        serviceTypes={serviceTypes}
        onClose={() => setIsGeneralModalOpen(false)}
        onSave={handleSaveGeneralTask}
        onAddServiceType={handleAddServiceType}
      />

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        isForce={isForcePassword}
        onClose={() => {
          if (!isForcePassword) setIsPasswordModalOpen(false);
        }}
        onSubmit={handleChangePassword}
      />

      {/* Ticket Modal */}
      <TicketBookingModal
        isOpen={isTicketModalOpen}
        ticket={selectedTicket}
        staffList={staffList}
        currentUser={currentUser}
        onClose={() => setIsTicketModalOpen(false)}
        onSave={handleSaveTicket}
      />

      {/* Passport Modal */}
      <PassportProcessModal
        isOpen={isPassportModalOpen}
        passport={selectedPassport}
        staffList={staffList}
        currentUser={currentUser}
        onClose={() => setIsPassportModalOpen(false)}
        onSave={handleSavePassport}
      />

      {/* Payment Management Modal */}
      <PaymentManagementModal
        isOpen={isPaymentModalOpen}
        booking={selectedPaymentBooking}
        currentUser={currentUser}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentAdded={handlePaymentAdded}
        onPaymentUpdated={handlePaymentUpdated}
        onPaymentDeleted={handlePaymentDeleted}
        onTotalAmountUpdated={handleTotalAmountUpdated}
      />

      {/* Reminders Slide Drawer */}
      {isRemindersOpen && (
        <RemindersDrawer
          isOpen={isRemindersOpen}
          reminders={allReminders}
          currentUser={currentUser}
          onClose={() => setIsRemindersOpen(false)}
          onAcknowledge={handleAcknowledgeReminder}
          onSelectBooking={(type, id) => {
            if (type === 'ticket') {
              const t = tickets.find(tk => tk.id === id);
              if (t) {
                setSelectedTicket(t);
                setIsTicketModalOpen(true);
              }
            } else {
              const p = passports.find(ps => ps.id === id);
              if (p) {
                setSelectedPassport(p);
                setIsPassportModalOpen(true);
              }
            }
          }}
        />
      )}

      {/* Auth Card Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <AuthCard
            initialMode="signin"
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => {
              setIsAuthModalOpen(false);
              refreshData();
            }}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 text-xs text-center">
        <p className="font-serif text-slate-200 text-sm font-semibold">Haashiya Air Travels</p>
        <p className="mt-1">Simple & Reliable Travel CRM • Ticket Bookings & Passport Processing Engine</p>
      </footer>

    </div>
  );
}
