import React, { useState, useEffect, useCallback } from 'react';
import { StaffUser, GeneralTask, DailyBriefingData, FollowUp } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { api } from '../api';
import { DailyBriefingModal } from './DailyBriefingModal';
import { exportToCSV } from '../utils/csvExport';
import { 
  CheckCircle2, Clock, AlertCircle, Calendar, User, Phone, 
  FileText, LogOut, Plane, RefreshCw, CheckSquare, 
  X, Loader2, Filter, Plus, Eye, CreditCard, DollarSign,
  Tag, Search, ShieldCheck, Sun, Download, MessageSquare
} from 'lucide-react';

interface StaffTaskDashboardProps {
  currentUser: StaffUser;
  onLogout: () => void;
}

export const StaffTaskDashboard: React.FC<StaffTaskDashboardProps> = ({
  currentUser,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'followups' | 'profile'>('tasks');
  const [tasks, setTasks] = useState<GeneralTask[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Follow-Up State
  const [fuStatusFilter, setFuStatusFilter] = useState<string>('all');
  const [isFuModalOpen, setIsFuModalOpen] = useState(false);
  const [fuTitle, setFuTitle] = useState('');
  const [fuCustomer, setFuCustomer] = useState('');
  const [fuMobile, setFuMobile] = useState('');
  const [fuScheduledAt, setFuScheduledAt] = useState('');
  const [fuNotes, setFuNotes] = useState('');
  const [fuSaving, setFuSaving] = useState(false);
  const [fuError, setFuError] = useState<string | null>(null);

  // Daily Briefing State
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [briefingData, setBriefingData] = useState<DailyBriefingData | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  // Staff Profile Edit State
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileAddress, setProfileAddress] = useState(currentUser.address || '');
  const [profileEmergencyName, setProfileEmergencyName] = useState(currentUser.emergency_contact_name || '');
  const [profileEmergencyPhone, setProfileEmergencyPhone] = useState(currentUser.emergency_contact_phone || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(currentUser.profile_photo_url || '');
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Status & Financial Update Modal State
  const [selectedTask, setSelectedTask] = useState<GeneralTask | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Pending');
  const [staffNote, setStaffNote] = useState<string>('');
  const [updateTotalAmount, setUpdateTotalAmount] = useState<number | ''>('');
  const [updateAmountPaid, setUpdateAmountPaid] = useState<number | ''>('');
  const [updatePaymentStatus, setUpdatePaymentStatus] = useState<string>('Unpaid');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Detail View Modal State
  const [viewDetailTask, setViewDetailTask] = useState<GeneralTask | null>(null);

  // Create Task Modal State (Manual Task Creation for Staff)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createCustomerName, setCreateCustomerName] = useState('');
  const [createMobileNumber, setCreateMobileNumber] = useState('');
  const [createServiceType, setCreateServiceType] = useState('Passport Process');
  const [createDescription, setCreateDescription] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createTotalAmount, setCreateTotalAmount] = useState<number | ''>('');
  const [createNote, setCreateNote] = useState('');
  
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const loadBriefing = useCallback(async (autoOpen = false) => {
    setLoadingBriefing(true);
    try {
      const data = await api.getDailyBriefing();
      setBriefingData(data);
      if (autoOpen) {
        setIsBriefingOpen(true);
      }
    } catch (err) {
      console.warn('Failed to load daily briefing for staff:', err);
    } finally {
      setLoadingBriefing(false);
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      await supabaseService.updateStaff(currentUser.id, {
        phone: profilePhone,
        address: profileAddress,
        emergency_contact_name: profileEmergencyName,
        emergency_contact_phone: profileEmergencyPhone,
        profile_photo_url: profilePhotoUrl,
      });
      setProfileSuccess('Profile details updated successfully!');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const loadStaffTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedTasks, fetchedFollowUps] = await Promise.all([
        supabaseService.getTasksForStaff(currentUser),
        supabaseService.getFollowUps().catch(() => [])
      ]);
      setTasks(fetchedTasks);
      setFollowUps(fetchedFollowUps);
    } catch (err) {
      console.error('Failed to load staff tasks or follow-ups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadStaffTasks();
    loadBriefing(true);
  }, [loadStaffTasks, loadBriefing]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStaffTasks();
    loadBriefing(false);
  };

  const handleOpenTaskModal = (task: GeneralTask) => {
    setSelectedTask(task);
    setNewStatus(task.status || 'Pending');
    setStaffNote(task.staffUpdateNote || task.staff_update_note || '');
    
    setUpdateTotalAmount(task.totalAmount !== undefined && task.totalAmount !== null ? task.totalAmount : '');
    setUpdateAmountPaid(task.amountPaid !== undefined && task.amountPaid !== null ? task.amountPaid : '');
    
    let initialPayStatus = task.paymentStatus || 'Unpaid';
    if (!task.paymentStatus) {
      const tAmt = task.totalAmount || 0;
      const pAmt = task.amountPaid || 0;
      if (tAmt > 0 && pAmt >= tAmt) initialPayStatus = 'Fully Paid';
      else if (pAmt > 0) initialPayStatus = 'Partially Paid';
      else initialPayStatus = 'Unpaid';
    }
    setUpdatePaymentStatus(initialPayStatus);

    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleUpdateTaskStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    const totalAmt = updateTotalAmount !== '' ? Number(updateTotalAmount) : (selectedTask.totalAmount || 0);
    const paidAmt = updateAmountPaid !== '' ? Number(updateAmountPaid) : (selectedTask.amountPaid || 0);
    const balDue = Math.max(0, totalAmt - paidAmt);

    let calcPaymentStatus = updatePaymentStatus;
    if (totalAmt > 0) {
      if (paidAmt >= totalAmt) calcPaymentStatus = 'Fully Paid';
      else if (paidAmt > 0) calcPaymentStatus = 'Partially Paid';
      else if (updatePaymentStatus === 'Unpaid' || !updatePaymentStatus) calcPaymentStatus = 'Unpaid';
    }

    try {
      const updated = await supabaseService.updateStaffTaskStatus(
        selectedTask.id,
        currentUser.id,
        currentUser.full_name || currentUser.name || 'Staff Member',
        newStatus,
        staffNote,
        selectedTask.title,
        selectedTask.status,
        {
          totalAmount: totalAmt,
          amountPaid: paidAmt,
          paymentStatus: calcPaymentStatus
        }
      );

      setSaveSuccess('Task status and amount updated successfully!');
      
      // Update local state list
      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? { 
          ...t, 
          ...updated, 
          status: newStatus,
          staffUpdateNote: staffNote,
          totalAmount: totalAmt, 
          amountPaid: paidAmt, 
          balanceDue: balDue, 
          paymentStatus: calcPaymentStatus 
        } : t))
      );

      setTimeout(() => {
        handleCloseModal();
        if (viewDetailTask && viewDetailTask.id === selectedTask.id) {
          setViewDetailTask({
            ...viewDetailTask,
            ...updated,
            status: newStatus,
            staffUpdateNote: staffNote,
            totalAmount: totalAmt,
            amountPaid: paidAmt,
            balanceDue: balDue,
            paymentStatus: calcPaymentStatus
          });
        }
      }, 1000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update task status.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (!createCustomerName.trim()) {
      setCreateError('Customer name is required.');
      return;
    }
    if (!createMobileNumber.trim()) {
      setCreateError('Mobile number is required.');
      return;
    }

    setCreateSaving(true);
    try {
      const title = createTitle.trim() || `${createServiceType} for ${createCustomerName.trim()}`;
      const newTask = await supabaseService.createStaffTask({
        title,
        customerName: createCustomerName.trim(),
        mobileNumber: createMobileNumber.trim(),
        serviceType: createServiceType,
        description: createDescription.trim(),
        dueDate: createDueDate || undefined,
        totalAmount: Number(createTotalAmount) || 0,
        assignedStaffId: currentUser.id,
        assignedStaffName: currentUser.full_name || currentUser.name || 'Staff Member',
        noteText: createNote.trim() || 'Created by staff'
      });

      setCreateSuccess('Task created successfully and assigned to you!');
      setTasks((prev) => [newTask, ...prev]);

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setCreateTitle('');
        setCreateCustomerName('');
        setCreateMobileNumber('');
        setCreateServiceType('Passport Process');
        setCreateDescription('');
        setCreateDueDate('');
        setCreateTotalAmount('');
        setCreateNote('');
        setCreateSuccess(null);
      }, 1200);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create task.');
    } finally {
      setCreateSaving(false);
    }
  };

  // Filter follow-ups assigned to staff
  const staffFollowUps = followUps.filter(f => {
    if (currentUser.role === 'admin' || currentUser.role === 'Admin') return true;
    if (!f.agent_id && !f.agent_code && !f.agent_name) return true;
    const nameLower = (currentUser.full_name || currentUser.name || '').toLowerCase();
    return (
      f.agent_id === currentUser.id ||
      (f.agent_code && currentUser.staff_code && f.agent_code.toLowerCase() === currentUser.staff_code.toLowerCase()) ||
      (f.agent_name && nameLower && f.agent_name.toLowerCase().includes(nameLower))
    );
  });

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuError(null);

    if (!fuTitle.trim() || !fuCustomer.trim() || !fuMobile.trim() || !fuScheduledAt) {
      setFuError('Title, Customer Name, Mobile Number, and Scheduled Date are required.');
      return;
    }

    try {
      setFuSaving(true);
      await supabaseService.createFollowUp({
        title: fuTitle.trim(),
        customer_name: fuCustomer.trim(),
        mobile_number: fuMobile.trim(),
        scheduled_at: new Date(fuScheduledAt).toISOString(),
        status: 'Pending',
        notes: fuNotes.trim(),
        agent_id: currentUser.id,
        agent_name: currentUser.full_name || currentUser.name || 'Staff Member',
        agent_code: currentUser.staff_code || 'STAFF'
      });

      setIsFuModalOpen(false);
      setFuTitle('');
      setFuCustomer('');
      setFuMobile('');
      setFuScheduledAt('');
      setFuNotes('');
      loadStaffTasks();
    } catch (err: any) {
      setFuError(err?.message || 'Failed to create follow-up task.');
    } finally {
      setFuSaving(false);
    }
  };

  const handleMarkFollowUpComplete = async (fu: FollowUp) => {
    try {
      await supabaseService.updateFollowUp(fu.id, { status: 'Completed' });
      loadStaffTasks();
    } catch (err) {
      console.error('Failed to update follow-up:', err);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (t.customerName || '').toLowerCase().includes(q);
      const titleMatch = (t.title || '').toLowerCase().includes(q);
      const mobileMatch = (t.mobileNumber || '').includes(q);
      const serviceMatch = (t.serviceType || '').toLowerCase().includes(q);
      return nameMatch || titleMatch || mobileMatch || serviceMatch;
    }
    return true;
  });

  // Export Staff Workload tasks to CSV
  const handleExportStaffCSV = () => {
    const headers = [
      'Task ID',
      'Service Type',
      'Task Title',
      'Customer Name',
      'Mobile Number',
      'Status',
      'Due Date',
      'Payment Status',
      'Total Amount (INR)',
      'Amount Paid (INR)',
      'Balance Due (INR)',
      'Admin Instructions / Description',
      'Staff Update Note',
      'Last Updated'
    ];

    const rows = filteredTasks.map((t) => [
      t.id,
      t.serviceType || t.service_type || 'General Task',
      t.title || '',
      t.customerName || t.customer_name || '',
      t.mobileNumber || t.mobile_number || '',
      t.status || 'Pending',
      t.dueDate || t.due_date || '',
      t.paymentStatus || 'Unpaid',
      t.totalAmount || 0,
      t.amountPaid || 0,
      t.balanceDue !== undefined ? t.balanceDue : Math.max(0, (t.totalAmount || 0) - (t.amountPaid || 0)),
      t.description || '',
      t.staffUpdateNote || t.staff_update_note || '',
      t.updatedAt || t.updated_at || ''
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    const staffName = (currentUser.full_name || currentUser.name || 'Staff').replace(/\s+/g, '_');
    exportToCSV(`Staff_Workload_${staffName}_${dateStr}.csv`, headers, rows);
  };

  // Metrics
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'Pending' || t.status === 'Enquiry').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress' || t.status === 'Submitted / Awaiting Approval' || t.status === 'Appointment Scheduled').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed' || t.status === 'Ready / Completed' || t.status === 'Delivered').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Ready / Completed':
      case 'Delivered':
      case 'Passport Issued & Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{status}</span>
          </span>
        );
      case 'In Progress':
      case 'Submitted / Awaiting Approval':
      case 'Application Submitted':
      case 'Appointment Scheduled':
      case 'Police Verification Pending':
      case 'Under Review at RPO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{status}</span>
          </span>
        );
      case 'On Hold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>On Hold</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{status}</span>
          </span>
        );
    }
  };

  const getPaymentBadge = (status?: string) => {
    if (status === 'Fully Paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3" />
          <span>Fully Paid</span>
        </span>
      );
    }
    if (status === 'Partially Paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <CreditCard className="w-3 h-3" />
          <span>Partial</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <DollarSign className="w-3 h-3" />
        <span>Unpaid</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      
      {/* Header Bar */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md">
              <Plane className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <h1 className="text-base font-bold font-serif leading-tight">Haashiya Air Travels</h1>
              <p className="text-[10px] text-indigo-300 font-semibold tracking-wider uppercase">Staff Workbench</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'followups'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Follow-ups</span>
              {staffFollowUps.filter(f => f.status === 'Pending').length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[10px] font-bold">
                  {staffFollowUps.filter(f => f.status === 'Pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              My Profile
            </button>
            <button
              onClick={() => {
                if (!briefingData) {
                  loadBriefing(true);
                } else {
                  setIsBriefingOpen(true);
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition flex items-center gap-1.5 border border-amber-500/30"
              title="Daily Operational Briefing"
            >
              <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Daily Briefing</span>
            </button>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold text-slate-200">{currentUser.full_name || currentUser.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-medium uppercase">
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'profile' ? (
          /* MY PROFILE VIEW */
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt={currentUser.full_name || currentUser.name}
                    className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xl border border-indigo-200 shadow-xs">
                    {(currentUser.full_name || currentUser.name || 'S').charAt(0).toUpperCase()}
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-bold text-slate-900">{currentUser.full_name || currentUser.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-bold bg-sky-50 text-sky-800 px-2.5 py-0.5 rounded border border-sky-200">
                      {currentUser.staff_code || 'HAT-0000'}
                    </span>
                    <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full capitalize">
                      {currentUser.role} Account
                    </span>
                  </div>
                </div>
              </div>

              {/* Readonly Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100">
                <div>
                  <span className="font-semibold text-slate-400 block">Email Address (Read-Only)</span>
                  <span className="font-bold text-slate-800">{currentUser.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">Designation</span>
                  <span className="font-bold text-slate-800">{currentUser.designation || 'Staff Member'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">Department</span>
                  <span className="font-bold text-slate-800">{currentUser.department || 'Operations'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 block">Joining Date</span>
                  <span className="font-bold text-slate-800">{currentUser.joining_date || 'N/A'}</span>
                </div>
              </div>

              {/* Editable Profile Form */}
              <form onSubmit={handleUpdateProfile} className="pt-4 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Edit Contact Details</h3>

                {profileSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo Image URL</label>
                    <input
                      type="url"
                      value={profilePhotoUrl}
                      onChange={(e) => setProfilePhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="Enter your current address"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Person</label>
                    <input
                      type="text"
                      value={profileEmergencyName}
                      onChange={(e) => setProfileEmergencyName(e.target.value)}
                      placeholder="Relative / Spouse name"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone Number</label>
                    <input
                      type="text"
                      value={profileEmergencyPhone}
                      onChange={(e) => setProfileEmergencyPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : activeTab === 'followups' ? (
          /* FOLLOW-UPS VIEW */
          <div>
            {/* Page Heading & Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Clock className="w-6 h-6 text-indigo-600" />
                  <span>Staff Follow-up Reminders</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Scheduled customer call-backs, payment follow-ups, and enquiry reminders assigned to you.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setFuTitle('');
                    setFuCustomer('');
                    setFuMobile('');
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setFuScheduledAt(tomorrow.toISOString().slice(0, 16));
                    setFuNotes('');
                    setFuError(null);
                    setIsFuModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule New Follow-up</span>
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-4 mb-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
                {['all', 'Pending', 'Completed', 'Cancelled'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFuStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${
                      fuStatusFilter === st
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'All Follow-ups' : st}
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-500">
                Total: {staffFollowUps.filter(f => fuStatusFilter === 'all' || f.status === fuStatusFilter).length}
              </span>
            </div>

            {/* Follow-ups List */}
            {staffFollowUps.filter(f => fuStatusFilter === 'all' || f.status === fuStatusFilter).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Follow-ups Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are currently no follow-up reminders scheduled for you in this filter category.
                </p>
                <button
                  onClick={() => setIsFuModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Follow-up</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffFollowUps
                  .filter(f => fuStatusFilter === 'all' || f.status === fuStatusFilter)
                  .map((fu) => (
                    <div 
                      key={fu.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              fu.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                              fu.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {fu.status}
                            </span>
                            <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(fu.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          {fu.status === 'Pending' && (
                            <button
                              onClick={() => handleMarkFollowUpComplete(fu)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center gap-1"
                              title="Mark as Completed"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Done</span>
                            </button>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mb-1">{fu.title}</h3>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{fu.customer_name}</span>
                          <span className="text-slate-300">•</span>
                          <a href={`tel:${fu.mobile_number}`} className="text-sky-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{fu.mobile_number}</span>
                          </a>
                        </div>

                        {fu.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-sans mt-2">
                            {fu.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>Assigned: <strong className="text-slate-700">{fu.agent_name || 'You'}</strong></span>
                        <a 
                          href={`https://wa.me/${fu.mobile_number.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          /* TASKS VIEW */
          <>
            {/* Page Heading & Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Assigned Workbench Tasks</h2>
                <p className="text-xs text-slate-500 mt-1">
                  View full customer case details, passport processes, ticket bookings, and manage your assigned workflow.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Export CSV Button */}
                <button
                  onClick={handleExportStaffCSV}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-md transition"
                  title="Download workload report as CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV ({filteredTasks.length})</span>
                </button>

                {/* Manual Task Creation Button */}
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Task for Myself</span>
                </button>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Status Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assigned</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{inProgressCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter:</span>
                </span>
                {['ALL', 'Pending', 'In Progress', 'Completed', 'On Hold'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                      statusFilter === status
                        ? 'bg-slate-900 text-white shadow'
                        : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer, title, mobile..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Task Cards List */}
            {loading ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-medium">Loading assigned tasks and customer records…</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No tasks found</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {statusFilter === 'ALL' && !searchQuery
                    ? 'You currently have no assigned tasks. Click "Create Task for Myself" to add a new task.'
                    : 'No tasks matching your active filter or search query.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTasks.map((task) => {
                  const taskTitle = task.title || `${task.serviceType || 'Task'} for ${task.customerName || 'Customer'}`;
                  const noteText = task.staffUpdateNote || task.staff_update_note;
                  const adminNoteText = task.adminNote || task.admin_note;

                  return (
                    <div
                      key={task.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col overflow-hidden"
                    >
                      <div className="p-5 flex-1 space-y-3">
                        
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                            {task.serviceType || 'General Task'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {getPaymentBadge(task.paymentStatus)}
                            {getStatusBadge(task.status)}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {taskTitle}
                        </h3>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                            {task.description}
                          </p>
                        )}

                        {/* Detailed Customer & Due Date Box */}
                        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                          {task.customerName && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-slate-800">{task.customerName}</span>
                              </div>
                              {task.mobileNumber && (
                                <a
                                  href={`tel:${task.mobileNumber}`}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{task.mobileNumber}</span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Financial Summary Line */}
                          {task.totalAmount !== undefined && task.totalAmount > 0 && (
                            <div className="flex items-center justify-between text-[11px] font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span>Total: <strong className="text-slate-900">₹{task.totalAmount.toLocaleString('en-IN')}</strong></span>
                              <span>Paid: <strong className="text-emerald-700">₹{(task.amountPaid || 0).toLocaleString('en-IN')}</strong></span>
                              <span>Due: <strong className={task.balanceDue && task.balanceDue > 0 ? "text-rose-600" : "text-emerald-600"}>₹{(task.balanceDue || 0).toLocaleString('en-IN')}</strong></span>
                            </div>
                          )}

                          {(task.dueDate || task.due_date) && (
                            <div className="flex items-center gap-2 text-rose-600 font-medium">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span>Due Date: {task.dueDate || task.due_date}</span>
                            </div>
                          )}
                        </div>

                        {/* Admin Note Box */}
                        {adminNoteText && (
                          <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1">
                            <span className="font-bold text-amber-800 block text-[10px] uppercase tracking-wider">
                              Admin Instructions / Note
                            </span>
                            <p>{adminNoteText}</p>
                          </div>
                        )}

                        {/* Latest Staff Update */}
                        {noteText && (
                          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-700 space-y-1">
                            <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider">
                              Your Progress Note
                            </span>
                            <p>{noteText}</p>
                          </div>
                        )}

                      </div>

                      {/* Card Action Footer */}
                      <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setViewDetailTask(task)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View Details</span>
                        </button>

                        <button
                          onClick={() => handleOpenTaskModal(task)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Update Status</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </main>

      {/* CREATE TASK MODAL FOR STAFF */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif">Create Task for Myself</h3>
                  <p className="text-xs text-indigo-200">
                    Assigned automatically to staff: {currentUser.full_name || currentUser.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateTask} className="p-6 overflow-y-auto space-y-4">
              
              {createSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Service / Task Type
                  </label>
                  <select
                    value={createServiceType}
                    onChange={(e) => setCreateServiceType(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Passport Process">Passport Process</option>
                    <option value="Flight Ticket">Flight Ticket</option>
                    <option value="Visa Application">Visa Application</option>
                    <option value="General Enquiry">General Enquiry</option>
                    <option value="Document Verification">Document Verification</option>
                    <option value="Payment Collection">Payment Collection</option>
                    <option value="Customer Followup">Customer Followup</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Task Title / Summary
                  </label>
                  <input
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. Passport Document Verification"
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createCustomerName}
                    onChange={(e) => setCreateCustomerName(e.target.value)}
                    placeholder="e.g. Mohammad Rahil"
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Customer Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={createMobileNumber}
                    onChange={(e) => setCreateMobileNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Total Amount / Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createTotalAmount}
                    onChange={(e) => setCreateTotalAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 4500"
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Task Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Enter details about what needs to be completed..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Progress Note
                </label>
                <input
                  type="text"
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                  placeholder="e.g. Documents collected from customer"
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition flex items-center gap-2 disabled:opacity-70"
                >
                  {createSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Task…</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save & Assign Task</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-serif">Update Task Status</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Record ID: {selectedTask.id}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateTaskStatus} className="p-6 space-y-4">
              
              {/* Task Title Summary */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <p className="text-xs font-bold text-slate-800">
                  {selectedTask.title || `${selectedTask.serviceType || 'Task'} for ${selectedTask.customerName || 'Customer'}`}
                </p>
                {selectedTask.description && (
                  <p className="text-xs text-slate-500 mt-1">{selectedTask.description}</p>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm font-semibold text-slate-800 outline-none transition"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Application Submitted">Application Submitted</option>
                  <option value="Appointment Scheduled">Appointment Scheduled</option>
                  <option value="Police Verification Pending">Police Verification Pending</option>
                  <option value="Completed">Completed / Ready</option>
                  <option value="Delivered">Delivered</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {/* Financial Amount & Payment Update Section */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Amount & Payment Update</span>
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    Financial Record
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Total Amount / Fee (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={updateTotalAmount}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setUpdateTotalAmount(val);
                        const tot = val !== '' ? Number(val) : 0;
                        const pd = updateAmountPaid !== '' ? Number(updateAmountPaid) : 0;
                        if (tot > 0) {
                          if (pd >= tot) setUpdatePaymentStatus('Fully Paid');
                          else if (pd > 0) setUpdatePaymentStatus('Partially Paid');
                          else setUpdatePaymentStatus('Unpaid');
                        }
                      }}
                      placeholder="e.g. 5000"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Amount Paid / Received (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={updateAmountPaid}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setUpdateAmountPaid(val);
                        const pd = val !== '' ? Number(val) : 0;
                        const tot = updateTotalAmount !== '' ? Number(updateTotalAmount) : 0;
                        if (tot > 0) {
                          if (pd >= tot) setUpdatePaymentStatus('Fully Paid');
                          else if (pd > 0) setUpdatePaymentStatus('Partially Paid');
                          else setUpdatePaymentStatus('Unpaid');
                        }
                      }}
                      placeholder="e.g. 2500"
                      className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={updatePaymentStatus}
                      onChange={(e) => setUpdatePaymentStatus(e.target.value)}
                      className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Fully Paid">Fully Paid</option>
                    </select>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Balance Due</span>
                    <span className={`text-xs font-bold ${
                      (Number(updateTotalAmount || 0) - Number(updateAmountPaid || 0)) > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      ₹{Math.max(0, Number(updateTotalAmount || 0) - Number(updateAmountPaid || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Staff Update Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Status Update Note / Details
                </label>
                <textarea
                  rows={3}
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="Enter details about your work progress or completion notes..."
                  className="w-full p-3.5 bg-white border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none transition resize-none"
                />
              </div>

              {/* Status Banners */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition flex items-center gap-2 disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Status…</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4" />
                      <span>Save Status Update</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FULL TASK DETAILS MODAL */}
      {viewDetailTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                  {viewDetailTask.serviceType || 'Assigned Task'}
                </span>
                <h3 className="text-lg font-bold font-serif mt-0.5">
                  {viewDetailTask.title || `${viewDetailTask.serviceType} for ${viewDetailTask.customerName}`}
                </h3>
              </div>
              <button
                onClick={() => setViewDetailTask(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Badges Bar */}
              <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Status:</span>
                  {getStatusBadge(viewDetailTask.status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Payment:</span>
                  {getPaymentBadge(viewDetailTask.paymentStatus)}
                </div>
              </div>

              {/* Customer Info Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customer Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Customer Name</span>
                    <span className="font-bold text-slate-800">{viewDetailTask.customerName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Mobile Number</span>
                    <a href={`tel:${viewDetailTask.mobileNumber}`} className="font-bold text-indigo-600 hover:underline">
                      {viewDetailTask.mobileNumber || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              {viewDetailTask.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Task Description & Details</span>
                  </h4>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
                    {viewDetailTask.description}
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Financial Breakdown</span>
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-indigo-600 block">Total Fee</span>
                    <span className="text-sm font-bold text-indigo-900">₹{(viewDetailTask.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">Amount Paid</span>
                    <span className="text-sm font-bold text-emerald-900">₹{(viewDetailTask.amountPaid || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-rose-600 block">Balance Due</span>
                    <span className="text-sm font-bold text-rose-900">₹{(viewDetailTask.balanceDue || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {(viewDetailTask.adminNote || viewDetailTask.admin_note) && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-800 uppercase text-[10px] tracking-wider block">
                    Admin Instructions
                  </span>
                  <p className="text-amber-900">{viewDetailTask.adminNote || viewDetailTask.admin_note}</p>
                </div>
              )}

              {/* Staff Update Notes */}
              {(viewDetailTask.staffUpdateNote || viewDetailTask.staff_update_note) && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
                    Latest Staff Progress Note
                  </span>
                  <p className="text-slate-800">{viewDetailTask.staffUpdateNote || viewDetailTask.staff_update_note}</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Created: {new Date(viewDetailTask.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewDetailTask(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleOpenTaskModal(viewDetailTask);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Update Status</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE FOLLOW-UP MODAL (STAFF) */}
      {isFuModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold">Schedule Customer Follow-up</h3>
              </div>
              <button
                onClick={() => setIsFuModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-5 space-y-4 text-xs">
              {fuError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{fuError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Title / Reason *</label>
                <input
                  type="text"
                  required
                  value={fuTitle}
                  onChange={(e) => setFuTitle(e.target.value)}
                  placeholder="e.g. Visa status call, Payment reminder, Passport renewal update"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={fuCustomer}
                  onChange={(e) => setFuCustomer(e.target.value)}
                  placeholder="Customer full name"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={fuMobile}
                  onChange={(e) => setFuMobile(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={fuScheduledAt}
                  onChange={(e) => setFuScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Special Instructions</label>
                <textarea
                  rows={2}
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  placeholder="Context regarding this call or enquiry..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFuModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fuSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {fuSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Schedule Follow-up</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DAILY BRIEFING MODAL */}
      <DailyBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        briefing={briefingData}
        currentUser={currentUser}
      />

    </div>
  );
};
