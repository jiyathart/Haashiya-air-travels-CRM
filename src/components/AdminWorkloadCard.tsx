import React from 'react';
import { TicketBooking, PassportProcess, StaffUser, TicketStatus, PassportStatus } from '../types';
import { Users, Ticket, FileText, CheckCircle2, Clock, AlertTriangle, UserCheck, ArrowRight } from 'lucide-react';

interface AdminWorkloadCardProps {
  tickets: TicketBooking[];
  passports: PassportProcess[];
  staffList: StaffUser[];
  onSelectStaffFilter?: (staffId: string) => void;
  onOpenNewTicketModal: () => void;
  onOpenNewPassportModal: () => void;
}

export const AdminWorkloadCard: React.FC<AdminWorkloadCardProps> = ({
  tickets,
  passports,
  staffList,
  onSelectStaffFilter,
  onOpenNewTicketModal,
  onOpenNewPassportModal
}) => {
  // Ticket status pipeline counts
  const ticketStatuses: TicketStatus[] = ['Enquiry', 'Confirmed', 'Ticketed', 'Completed', 'Cancelled'];
  const ticketCounts = ticketStatuses.reduce((acc, status) => {
    acc[status] = tickets.filter(t => t.ticketStatus === status).length;
    return acc;
  }, {} as Record<TicketStatus, number>);

  // Passport status pipeline counts
  const passportStatuses: PassportStatus[] = [
    'Application Submitted',
    'Appointment Booked',
    'Biometric Done',
    'Police Verification',
    'Printing',
    'Dispatched',
    'Delivered'
  ];
  const passportCounts = passportStatuses.reduce((acc, status) => {
    acc[status] = passports.filter(p => p.passportStatus === status).length;
    return acc;
  }, {} as Record<PassportStatus, number>);

  // Calculate staff workload summary
  const activeStaff = staffList.filter(s => s.status === 'active');
  const staffWorkload = activeStaff.map(s => {
    const openTickets = tickets.filter(
      t => t.assignedStaffId === s.id && t.ticketStatus !== 'Completed' && t.ticketStatus !== 'Cancelled'
    ).length;
    const openPassports = passports.filter(
      p => p.assignedStaffId === s.id && p.passportStatus !== 'Delivered'
    ).length;
    return {
      staff: s,
      openTickets,
      openPassports,
      totalActive: openTickets + openPassports
    };
  });

  // Sort staff by capacity (lowest workload first for new assignments)
  staffWorkload.sort((a, b) => a.totalActive - b.totalActive);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Active Tickets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Flight Tickets</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {tickets.filter(t => t.ticketStatus !== 'Completed' && t.ticketStatus !== 'Cancelled').length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {tickets.length} total recorded bookings
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Active Passports */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Passport Cases</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {passports.filter(p => p.passportStatus !== 'Delivered').length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {passports.length} total passport applications
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Active Staff Members */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Staff Capacity</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {activeStaff.length} Members
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Ready for booking assignments
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Create Buttons */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-5 rounded-2xl shadow-md text-white flex flex-col justify-between">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Quick Dispatch</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={onOpenNewTicketModal}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 px-2.5 rounded-xl shadow transition text-center"
            >
              + New Ticket
            </button>
            <button
              onClick={onOpenNewPassportModal}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs py-2 px-2.5 rounded-xl shadow transition text-center"
            >
              + New Passport
            </button>
          </div>
        </div>

      </div>

      {/* Staff Workload Distribution Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Staff Workload & Capacity Management
            </h3>
            <p className="text-xs text-slate-500">
              Shows live open cases assigned per team member. Assign new work to staff with available capacity.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {staffWorkload.map(({ staff, openTickets, openPassports, totalActive }) => (
            <div
              key={staff.id}
              onClick={() => onSelectStaffFilter && onSelectStaffFilter(staff.id)}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition bg-slate-50/50 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-700 transition">
                  {staff.name}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  totalActive === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : totalActive <= 3
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {totalActive} Active Cases
                </span>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Open Tickets:</span>
                  <span className="font-semibold text-slate-700">{openTickets}</span>
                </div>
                <div className="flex justify-between">
                  <span>Open Passports:</span>
                  <span className="font-semibold text-slate-700">{openPassports}</span>
                </div>
              </div>

              {/* Capacity meter */}
              <div className="mt-3">
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      totalActive <= 2
                        ? 'bg-emerald-500'
                        : totalActive <= 5
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (totalActive / 8) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Pipeline Pipelines (Tickets & Passports) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ticket Pipeline Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-blue-600" />
            Flight Ticket Status Breakdown
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-sky-50 border border-sky-200/60 rounded-xl text-center">
              <span className="text-[10px] font-bold text-sky-700 uppercase">Enquiry</span>
              <p className="text-xl font-extrabold text-sky-900 mt-0.5">{ticketCounts['Enquiry']}</p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200/60 rounded-xl text-center">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Confirmed</span>
              <p className="text-xl font-extrabold text-indigo-900 mt-0.5">{ticketCounts['Confirmed']}</p>
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200/60 rounded-xl text-center">
              <span className="text-[10px] font-bold text-teal-700 uppercase">Ticketed</span>
              <p className="text-xl font-extrabold text-teal-900 mt-0.5">{ticketCounts['Ticketed']}</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Completed</span>
              <p className="text-xl font-extrabold text-emerald-900 mt-0.5">{ticketCounts['Completed']}</p>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200/60 rounded-xl text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Cancelled</span>
              <p className="text-xl font-extrabold text-rose-900 mt-0.5">{ticketCounts['Cancelled']}</p>
            </div>
          </div>
        </div>

        {/* Passport Pipeline Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Passport Process Stage Breakdown
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-slate-100 rounded-xl text-center">
              <span className="text-[9px] font-bold text-slate-600 uppercase">Submitted</span>
              <p className="text-lg font-bold text-slate-800">{passportCounts['Application Submitted']}</p>
            </div>
            <div className="p-2.5 bg-sky-50 rounded-xl text-center">
              <span className="text-[9px] font-bold text-sky-700 uppercase">Appt Booked</span>
              <p className="text-lg font-bold text-sky-900">{passportCounts['Appointment Booked']}</p>
            </div>
            <div className="p-2.5 bg-violet-50 rounded-xl text-center">
              <span className="text-[9px] font-bold text-violet-700 uppercase">Biometric Done</span>
              <p className="text-lg font-bold text-violet-900">{passportCounts['Biometric Done']}</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl text-center">
              <span className="text-[9px] font-bold text-amber-700 uppercase">Police Verif.</span>
              <p className="text-lg font-bold text-amber-900">{passportCounts['Police Verification']}</p>
            </div>
            <div className="p-2.5 bg-orange-50 rounded-xl text-center">
              <span className="text-[9px] font-bold text-orange-700 uppercase">Printing</span>
              <p className="text-lg font-bold text-orange-900">{passportCounts['Printing']}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-center">
              <span className="text-[9px] font-bold text-emerald-700 uppercase">Dispatched</span>
              <p className="text-lg font-bold text-emerald-900">{passportCounts['Dispatched']}</p>
            </div>
            <div className="p-2.5 bg-green-100 rounded-xl text-center col-span-2">
              <span className="text-[9px] font-bold text-green-800 uppercase">Delivered</span>
              <p className="text-lg font-bold text-green-950">{passportCounts['Delivered']}</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
