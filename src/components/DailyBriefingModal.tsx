import React from 'react';
import { DailyBriefingData, StaffUser, ReminderAlert } from '../types';
import { 
  Sun, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  Users, 
  Briefcase, 
  X, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

interface DailyBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefing: DailyBriefingData | null;
  reminders?: ReminderAlert[];
  currentUser: StaffUser;
  staffList?: StaffUser[];
  onNavigateToRecord?: (type: 'ticket' | 'passport' | 'general', id: string) => void;
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
  isOpen,
  onClose,
  briefing,
  reminders = [],
  currentUser,
  staffList = [],
  onNavigateToRecord
}) => {
  if (!isOpen || !briefing) return null;

  const isAdmin = currentUser.role === 'Admin';
  const staffMap = new Map((staffList || []).map(s => [s.id, s.name]));

  // Today's due reminders
  const urgentReminders = (reminders || []).filter(r => r.category === 'Today' || r.category === 'Overdue');

  const todaySchedule = briefing.todaySchedule || [];
  const workloadSnapshot = briefing.workloadSnapshot || [];
  const overdueByStaff = briefing.overdueByStaff || [];
  const yesterdayCompletedItems = briefing.yesterdayCompletedItems || [];

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-emerald-200 font-medium text-sm mb-1">
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span>Haashiya Air Travels CRM • Morning Briefing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Good Morning, {currentUser.name}! 👋
            </h2>
            <p className="text-emerald-100/90 text-sm mt-1">
              Here is your operational snapshot for <span className="font-semibold text-white">{todayFormatted}</span>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 text-emerald-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            title="Close Briefing"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Decorative background circle */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 bg-slate-50/50 flex-1">

          {/* Admin High-Level Stats Bar */}
          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-800">
                    {briefing.newEnquiriesLast24h || 0}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    New Enquiries (Last 24h)
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-800">
                    ₹{briefing.pendingPaymentAmount.toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    Pending Payments ({briefing.pendingPaymentCount} Bookings)
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-800">
                    {briefing.yesterdayCompletedCount}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    Completed Recently (48h)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid Layout for Schedule & Urgent Action Items */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Today's Schedule & Appointments */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-base">
                    Today's Schedule & Reporting
                  </h3>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {todaySchedule.length} Items
                </span>
              </div>

              {todaySchedule.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                  No flight reportings, appointments, or task due dates scheduled for today.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {todaySchedule.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => onNavigateToRecord?.(item.bookingType, item.id)}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-lg border border-slate-200/80 hover:border-emerald-200 transition-all cursor-pointer group flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded ${
                            item.bookingType === 'ticket' ? 'bg-blue-100 text-blue-800' :
                            item.bookingType === 'passport' ? 'bg-purple-100 text-purple-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.bookingType}
                          </span>
                          <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">
                            {item.customerName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {item.serviceOrFlight}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                          {item.time && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Clock className="w-3 h-3 text-slate-400" /> {item.time}
                            </span>
                          )}
                          {isAdmin && (
                            <span>Staff: {item.assignedStaffName}</span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-semibold px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 whitespace-nowrap">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Items / Reminders Due Today */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-slate-800 text-base">
                    Active Reminders & Alerts
                  </h3>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  urgentReminders.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {urgentReminders.length} Active
                </span>
              </div>

              {urgentReminders.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                  All clear! No overdue items or pending alerts assigned to you right now.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {urgentReminders.slice(0, 6).map((rem) => (
                    <div 
                      key={rem.id}
                      onClick={() => onNavigateToRecord?.(rem.type, rem.recordId)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer group flex items-start justify-between gap-3 ${
                        rem.severity === 'urgent' 
                          ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300' 
                          : 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            rem.severity === 'urgent' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            {rem.category}
                          </span>
                          <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-700">
                            {rem.customerName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 font-medium">
                          {rem.message}
                        </p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all mt-1" />
                    </div>
                  ))}
                  {urgentReminders.length > 6 && (
                    <div className="text-center text-xs text-slate-500 pt-1 font-medium">
                      + {urgentReminders.length - 6} more reminders in notification panel
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Admin Office-Wide Workload & Overdue Section */}
          {isAdmin && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800 text-base">
                    Office Staff Workload & Overdue Monitoring
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Live Office Overview</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Staff Workload Table */}
                <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Staff Active Workload
                  </div>
                  <div className="divide-y divide-slate-100">
                    {briefing.workloadSnapshot?.map((staff) => (
                      <div key={staff.staffId} className="p-3 flex items-center justify-between text-xs">
                        <div className="font-semibold text-slate-800">
                          {staff.staffName}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium" title="Tickets">
                            {staff.ticketCount} Tkt
                          </span>
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium" title="Passports">
                            {staff.passportCount} Pass
                          </span>
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium" title="General Services">
                            {staff.generalTaskCount} Gen
                          </span>
                          <span className="font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded ml-1">
                            {staff.totalActiveCount} Total
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overdue/Stalled Items By Staff */}
                <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                    <span>Overdue & Stalled by Staff</span>
                    <span className="text-slate-500 font-normal">Need Attention</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {briefing.overdueByStaff?.map((s) => (
                      <div key={s.staffId} className="p-3 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{s.staffName}</span>
                        <div className="flex items-center gap-2">
                          {s.overdueCount > 0 ? (
                            <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                              {s.overdueCount} Overdue
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium text-[11px]">0 Overdue</span>
                          )}

                          {s.stalledCount > 0 && (
                            <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                              {s.stalledCount} Stalled (&gt;3d)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Staff Yesterday Summary Section */}
          {yesterdayCompletedItems.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Recently Completed & Delivered Items (Last 48h)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {yesterdayCompletedItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-emerald-50/30 rounded-lg border border-emerald-100/80 text-xs">
                    <div className="font-bold text-slate-800">{item.customerName}</div>
                    <div className="text-slate-600 mt-0.5">{item.serviceOrFlight}</div>
                    <div className="text-[10px] text-emerald-700 font-medium mt-1">
                      Completed by {item.assignedStaffName}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Logged in as <span className="text-slate-800 font-bold">{currentUser.name}</span> ({currentUser.role})
          </div>
          <button
            onClick={onClose}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <span>Acknowledge & Go to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
