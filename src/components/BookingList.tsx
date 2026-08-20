import React, { useState } from 'react';
import { TicketBooking, PassportProcess, GeneralTask, StaffUser, TicketStatus, PassportStatus, GeneralTaskStatus } from '../types';
import { formatDateLabel, formatDateTimeLabel } from '../utils/dateUtils';
import { exportToCSV } from '../utils/csvExport';
import { Ticket, FileText, Search, Filter, User, Phone, Calendar, Clock, Edit, MessageSquare, ChevronRight, UserCheck, CreditCard, DollarSign, Briefcase, Plus, Download } from 'lucide-react';

interface BookingListProps {
  tickets: TicketBooking[];
  passports: PassportProcess[];
  generalTasks: GeneralTask[];
  staffList: StaffUser[];
  currentUser: StaffUser;
  selectedStaffFilter?: string;
  onOpenTicket: (ticket: TicketBooking) => void;
  onOpenPassport: (passport: PassportProcess) => void;
  onOpenGeneralTask: (task: GeneralTask) => void;
  onOpenPaymentModal: (booking: TicketBooking | PassportProcess | GeneralTask) => void;
  onQuickReassignTicket: (ticketId: string, newStaffId: string) => Promise<void>;
  onQuickReassignPassport: (passportId: string, newStaffId: string) => Promise<void>;
  onQuickReassignGeneralTask: (taskId: string, newStaffId: string) => Promise<void>;
  onQuickStatusTicket: (ticketId: string, status: TicketStatus) => Promise<void>;
  onQuickStatusPassport: (passportId: string, status: PassportStatus) => Promise<void>;
  onQuickStatusGeneralTask: (taskId: string, status: GeneralTaskStatus) => Promise<void>;
  onOpenNewTicketModal: () => void;
  onOpenNewPassportModal: () => void;
  onOpenNewGeneralModal: () => void;
}

export const BookingList: React.FC<BookingListProps> = ({
  tickets,
  passports,
  generalTasks,
  staffList,
  currentUser,
  selectedStaffFilter,
  onOpenTicket,
  onOpenPassport,
  onOpenGeneralTask,
  onOpenPaymentModal,
  onQuickReassignTicket,
  onQuickReassignPassport,
  onQuickReassignGeneralTask,
  onQuickStatusTicket,
  onQuickStatusPassport,
  onQuickStatusGeneralTask,
  onOpenNewTicketModal,
  onOpenNewPassportModal,
  onOpenNewGeneralModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState<'all' | 'tickets' | 'passports' | 'general'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>(selectedStaffFilter || 'all');

  const activeStaff = staffList.filter(s => s.status === 'active');
  const staffMap = new Map(staffList.map(s => [s.id, s.name]));

  // Combine tickets, passports, and general tasks into unified list items
  const ticketItems = tickets.map(t => ({
    type: 'ticket' as const,
    id: t.id,
    name: t.customerName,
    mobile: t.mobileNumber,
    refCode: t.pnr ? `PNR: ${t.pnr}` : `${t.airline || ''} ${t.flightNumber || ''}`,
    subDetail: `${t.departureAirport || ''} → ${t.arrivalAirport || ''}`,
    dateLabel: t.departureDate,
    timeLabel: t.reportingTime ? `Reporting: ${t.reportingTime}` : t.departureTime,
    status: t.ticketStatus,
    assignedStaffId: t.assignedStaffId,
    assignedStaffName: staffMap.get(t.assignedStaffId) || 'Unassigned',
    paymentStatus: t.paymentStatus || 'Unpaid',
    balanceDue: t.balanceDue || 0,
    totalAmount: t.totalAmount || 0,
    updatedAt: t.updatedAt,
    notesCount: t.notes?.length || 0,
    rawObject: t
  }));

  const passportItems = passports.map(p => ({
    type: 'passport' as const,
    id: p.id,
    name: p.applicantName,
    mobile: p.mobileNumber,
    refCode: p.applicationNumber ? `ARN: ${p.applicationNumber}` : p.serviceType,
    subDetail: p.passportSevaKendra || 'PSK N/A',
    dateLabel: p.appointmentDate,
    timeLabel: p.appointmentTime ? `Appt: ${p.appointmentTime}` : '',
    status: p.passportStatus,
    assignedStaffId: p.assignedStaffId,
    assignedStaffName: staffMap.get(p.assignedStaffId) || 'Unassigned',
    paymentStatus: p.paymentStatus || 'Unpaid',
    balanceDue: p.balanceDue || 0,
    totalAmount: p.totalAmount || 0,
    updatedAt: p.updatedAt,
    notesCount: p.notes?.length || 0,
    rawObject: p
  }));

  const generalItems = (generalTasks || []).map(g => ({
    type: 'general' as const,
    id: g.id,
    name: g.customerName,
    mobile: g.mobileNumber,
    refCode: `Service: ${g.serviceType}`,
    subDetail: g.description || 'No description provided',
    dateLabel: g.dueDate,
    timeLabel: g.dueDate ? `Due: ${g.dueDate}` : 'No due date',
    status: g.status,
    assignedStaffId: g.assignedStaffId,
    assignedStaffName: staffMap.get(g.assignedStaffId) || 'Unassigned',
    paymentStatus: g.paymentStatus || 'Unpaid',
    balanceDue: g.balanceDue || 0,
    totalAmount: g.totalAmount || 0,
    updatedAt: g.updatedAt,
    notesCount: g.notes?.length || 0,
    rawObject: g
  }));

  let combined = [];
  if (recordTypeFilter === 'all') {
    combined = [...ticketItems, ...passportItems, ...generalItems];
  } else if (recordTypeFilter === 'tickets') {
    combined = ticketItems;
  } else if (recordTypeFilter === 'passports') {
    combined = passportItems;
  } else {
    combined = generalItems;
  }

  // Filter by search query
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    combined = combined.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.mobile.toLowerCase().includes(q) ||
      item.refCode.toLowerCase().includes(q) ||
      item.subDetail.toLowerCase().includes(q)
    );
  }

  // Filter by assigned staff
  if (staffFilter !== 'all') {
    combined = combined.filter(item => item.assignedStaffId === staffFilter);
  }

  // Filter by status
  if (statusFilter !== 'all') {
    combined = combined.filter(item => item.status === statusFilter);
  }

  // Sort by updatedAt descending
  combined.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Export filtered workload to CSV
  const handleExportCSV = () => {
    const headers = [
      'Record Type',
      'ID',
      'Customer / Applicant Name',
      'Mobile Number',
      'Reference / Airline / ARN',
      'Details / Route / PSK',
      'Date',
      'Time / Reporting',
      'Status',
      'Assigned Staff',
      'Payment Status',
      'Total Amount (INR)',
      'Amount Paid (INR)',
      'Balance Due (INR)'
    ];

    const rows = combined.map(item => [
      item.type.toUpperCase(),
      item.id,
      item.name,
      item.mobile,
      item.refCode,
      item.subDetail,
      item.dateLabel || '',
      item.timeLabel || '',
      item.status,
      item.assignedStaffName,
      item.paymentStatus,
      item.totalAmount,
      Math.max(0, item.totalAmount - item.balanceDue),
      item.balanceDue
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filterLabel = recordTypeFilter === 'all' ? 'All_Workload' : recordTypeFilter;
    exportToCSV(`Haashiya_${filterLabel}_Report_${dateStr}.csv`, headers, rows);
  };

  // Badge Color Mapper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Enquiry':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Confirmed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Ticketed':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Completed':
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Application Submitted':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Appointment Booked':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Biometric Done':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'Police Verification':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Printing':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Dispatched':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Control Bar: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, mobile, PNR, ARN, or flight..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* New Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
              title="Download filtered report as CSV file"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV ({combined.length})</span>
            </button>
            <button
              onClick={onOpenNewTicketModal}
              className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Ticket className="w-4 h-4" />
              <span>+ Ticket</span>
            </button>
            <button
              onClick={onOpenNewPassportModal}
              className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>+ Passport</span>
            </button>
            <button
              onClick={onOpenNewGeneralModal}
              className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4" />
              <span>+ e-Sevai / Task</span>
            </button>
          </div>

        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs border-t border-slate-100">
          
          {/* Record Type Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setRecordTypeFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                recordTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              All Work ({tickets.length + passports.length + (generalTasks?.length || 0)})
            </button>
            <button
              onClick={() => setRecordTypeFilter('tickets')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                recordTypeFilter === 'tickets' ? 'bg-white text-blue-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Tickets ({tickets.length})
            </button>
            <button
              onClick={() => setRecordTypeFilter('passports')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                recordTypeFilter === 'passports' ? 'bg-white text-indigo-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              Passports ({passports.length})
            </button>
            <button
              onClick={() => setRecordTypeFilter('general')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                recordTypeFilter === 'general' ? 'bg-white text-amber-900 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              e-Sevai / Services ({(generalTasks?.length || 0)})
            </button>
          </div>

          {/* Assigned Staff Filter (For Admin) */}
          {currentUser.role === 'Admin' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px]">Staff:</span>
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="all">All Staff Members</option>
                {activeStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">All Statuses</option>
              {recordTypeFilter !== 'passports' && (
                <>
                  <option value="Enquiry">Enquiry</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Ticketed">Ticketed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </>
              )}
              {recordTypeFilter !== 'tickets' && (
                <>
                  <option value="Application Submitted">Application Submitted</option>
                  <option value="Appointment Booked">Appointment Booked</option>
                  <option value="Biometric Done">Biometric Done</option>
                  <option value="Police Verification">Police Verification</option>
                  <option value="Printing">Printing</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Delivered">Delivered</option>
                </>
              )}
            </select>
          </div>

          <div className="ml-auto text-[11px] text-slate-400 font-medium">
            Showing {combined.length} records
          </div>

        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Type</th>
                <th className="p-4">Customer / Applicant</th>
                <th className="p-4">Booking / PSK Reference</th>
                <th className="p-4">Schedule / Reporting</th>
                <th className="p-4">Pipeline Status</th>
                <th className="p-4">Payment & Balance</th>
                <th className="p-4">Assigned Staff</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {combined.length > 0 ? (
                combined.map((item) => (
                  <tr
                    key={`${item.type}-${item.id}`}
                    className="hover:bg-slate-50/90 transition group cursor-pointer"
                    onClick={() => {
                      if (item.type === 'ticket') onOpenTicket(item.rawObject as TicketBooking);
                      else if (item.type === 'passport') onOpenPassport(item.rawObject as PassportProcess);
                      else onOpenGeneralTask(item.rawObject as GeneralTask);
                    }}
                  >
                    
                    {/* Record Type Badge */}
                    <td className="p-4">
                      {item.type === 'ticket' ? (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-blue-200">
                          <Ticket className="w-3 h-3" /> Flight
                        </span>
                      ) : item.type === 'passport' ? (
                        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-indigo-200">
                          <FileText className="w-3 h-3" /> Passport
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase border border-amber-200">
                          <Briefcase className="w-3 h-3" /> Service
                        </span>
                      )}
                    </td>

                    {/* Customer Info */}
                    <td className="p-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {item.mobile}
                      </div>
                    </td>

                    {/* Reference Details */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        {item.refCode}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {item.subDetail}
                      </div>
                    </td>

                    {/* Schedule / Reporting */}
                    <td className="p-4">
                      <div className="text-slate-900 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateLabel(item.dateLabel)}
                      </div>
                      <div className="text-[11px] text-blue-700 font-mono font-medium">
                        {item.timeLabel}
                      </div>
                    </td>

                    {/* Status Badge & Quick Status Switcher */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      {item.type === 'ticket' ? (
                        <select
                          value={item.status}
                          onChange={(e) => onQuickStatusTicket(item.id, e.target.value as TicketStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase cursor-pointer ${getStatusBadge(item.status)} focus:ring-2 focus:ring-blue-600`}
                        >
                          <option value="Enquiry">Enquiry</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Ticketed">Ticketed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : item.type === 'passport' ? (
                        <select
                          value={item.status}
                          onChange={(e) => onQuickStatusPassport(item.id, e.target.value as PassportStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase cursor-pointer ${getStatusBadge(item.status)} focus:ring-2 focus:ring-indigo-600`}
                        >
                          <option value="Application Submitted">Application Submitted</option>
                          <option value="Appointment Booked">Appointment Booked</option>
                          <option value="Biometric Done">Biometric Done</option>
                          <option value="Police Verification">Police Verification</option>
                          <option value="Printing">Printing</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      ) : (
                        <select
                          value={item.status}
                          onChange={(e) => onQuickStatusGeneralTask(item.id, e.target.value as GeneralTaskStatus)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border uppercase cursor-pointer ${getStatusBadge(item.status)} focus:ring-2 focus:ring-amber-600`}
                        >
                          <option value="Enquiry">Enquiry</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Submitted / Awaiting Approval">Submitted / Awaiting Approval</option>
                          <option value="Action Needed">Action Needed</option>
                          <option value="Ready / Completed">Ready / Completed</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      )}
                    </td>

                    {/* Payment & Balance Column */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenPaymentModal(item.rawObject as any)}
                        className="text-left group/pay hover:opacity-90"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.paymentStatus === 'Fully Paid'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {item.paymentStatus}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 mt-1">
                          {item.balanceDue > 0 ? (
                            <span className="text-rose-700">Due: ₹{item.balanceDue.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-emerald-700">Paid ₹{item.totalAmount.toLocaleString('en-IN')}</span>
                          )}
                        </div>
                      </button>
                    </td>

                    {/* Assigned Staff (Admin quick reassign) */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      {currentUser.role === 'Admin' ? (
                        <select
                          value={item.assignedStaffId}
                          onChange={(e) => {
                            if (item.type === 'ticket') onQuickReassignTicket(item.id, e.target.value);
                            else if (item.type === 'passport') onQuickReassignPassport(item.id, e.target.value);
                            else onQuickReassignGeneralTask(item.id, e.target.value);
                          }}
                          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 font-medium text-slate-800 focus:ring-1 focus:ring-blue-600"
                        >
                          {activeStaff.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-700 font-semibold text-xs">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.assignedStaffName}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPaymentModal(item.rawObject as any);
                          }}
                          className="px-2 py-1 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg font-semibold transition flex items-center gap-1"
                          title="View / Add Payments"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Pay</span>
                        </button>

                        {item.notesCount > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-slate-500" /> {item.notesCount}
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.type === 'ticket') onOpenTicket(item.rawObject as TicketBooking);
                            else onOpenPassport(item.rawObject as PassportProcess);
                          }}
                          className="px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg font-semibold transition flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 space-y-2">
                    <Filter className="w-8 h-8 mx-auto opacity-50 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-600">No matching bookings found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search query or filter settings.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
