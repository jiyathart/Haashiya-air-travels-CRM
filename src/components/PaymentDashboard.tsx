import React, { useState } from 'react';
import { TicketBooking, PassportProcess, GeneralTask, StaffUser, PaymentStatus } from '../types';
import { DollarSign, Wallet, AlertCircle, CheckCircle2, Clock, Users, ArrowUpRight, Filter, Search, ShieldAlert, CreditCard } from 'lucide-react';
import { formatDateLabel } from '../utils/dateUtils';

interface PaymentDashboardProps {
  tickets: TicketBooking[];
  passports: PassportProcess[];
  generalTasks?: GeneralTask[];
  staffList: StaffUser[];
  onSelectBooking: (booking: TicketBooking | PassportProcess | GeneralTask) => void;
}

export const PaymentDashboard: React.FC<PaymentDashboardProps> = ({
  tickets,
  passports,
  generalTasks = [],
  staffList,
  onSelectBooking,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Combine all active bookings
  const allBookings: Array<(TicketBooking | PassportProcess | GeneralTask) & { customerOrApplicantName: string }> = [
    ...tickets.map((t) => ({ ...t, customerOrApplicantName: t.customerName })),
    ...passports.map((p) => ({ ...p, customerOrApplicantName: p.applicantName })),
    ...generalTasks.map((g) => ({ ...g, customerOrApplicantName: g.customerName })),
  ];

  // Global Financial Metrics
  const totalOutstandingBalance = allBookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
  const totalAmountCollected = allBookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const totalBilled = allBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Status Counts
  const unpaidBookings = allBookings.filter((b) => (b.paymentStatus || 'Unpaid') === 'Unpaid');
  const partiallyPaidBookings = allBookings.filter((b) => b.paymentStatus === 'Partially Paid');
  const fullyPaidBookings = allBookings.filter((b) => b.paymentStatus === 'Fully Paid');

  // Per-Staff Breakdown
  const staffBreakdown = staffList.map((s) => {
    const staffBookings = allBookings.filter((b) => b.assignedStaffId === s.id);
    const pendingBookings = staffBookings.filter((b) => (b.balanceDue || 0) > 0);
    const totalPending = pendingBookings.reduce((sum, b) => sum + (b.balanceDue || 0), 0);
    const totalCollected = staffBookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
    const totalVolume = staffBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return {
      staffId: s.id,
      staffName: s.name,
      staffRole: s.role,
      totalCount: staffBookings.length,
      pendingCount: pendingBookings.length,
      totalPending,
      totalCollected,
      totalVolume,
    };
  });

  // Filtered Bookings Table
  const filteredBookings = allBookings.filter((b) => {
    // Status Filter
    if (selectedStatusFilter !== 'ALL' && (b.paymentStatus || 'Unpaid') !== selectedStatusFilter) {
      return false;
    }
    // Staff Filter
    if (selectedStaffFilter !== 'ALL' && b.assignedStaffId !== selectedStaffFilter) {
      return false;
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = b.customerOrApplicantName.toLowerCase().includes(q);
      const phoneMatch = b.mobileNumber.toLowerCase().includes(q);
      const idMatch = b.id.toLowerCase().includes(q);
      return nameMatch || phoneMatch || idMatch;
    }
    return true;
  });

  const getStaffName = (staffId: string) => {
    const s = staffList.find((st) => st.id === staffId);
    return s ? s.name : 'Unassigned';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Outstanding Balance */}
        <div className="bg-gradient-to-br from-rose-900 to-rose-950 text-white p-5 rounded-2xl shadow-lg border border-rose-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">Total Outstanding</span>
            <div className="p-2 bg-rose-800/60 rounded-xl">
              <DollarSign className="w-5 h-5 text-rose-200" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-white">
              ₹{totalOutstandingBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-rose-300 mt-1">
              From {unpaidBookings.length + partiallyPaidBookings.length} bookings with pending dues
            </p>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue Collected</span>
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-emerald-700">
              ₹{totalAmountCollected.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Out of ₹{totalBilled.toLocaleString('en-IN')} total billing
            </p>
          </div>
        </div>

        {/* Payment Status Counts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 col-span-1 md:col-span-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Bookings Payment Status Breakdown
          </span>
          <div className="grid grid-cols-3 gap-2">
            
            <button
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Unpaid' ? 'ALL' : 'Unpaid')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStatusFilter === 'Unpaid'
                  ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-500'
                  : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60'
              }`}
            >
              <div className="flex items-center justify-between text-rose-800">
                <span className="text-xs font-semibold">Unpaid</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-xl font-bold text-rose-900 mt-1">{unpaidBookings.length}</div>
              <span className="text-[10px] text-rose-700">No payment taken</span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Partially Paid' ? 'ALL' : 'Partially Paid')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStatusFilter === 'Partially Paid'
                  ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500'
                  : 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60'
              }`}
            >
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-xs font-semibold">Partially Paid</span>
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-bold text-amber-900 mt-1">{partiallyPaidBookings.length}</div>
              <span className="text-[10px] text-amber-700">Advance received</span>
            </button>

            <button
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Fully Paid' ? 'ALL' : 'Fully Paid')}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedStatusFilter === 'Fully Paid'
                  ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500'
                  : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60'
              }`}
            >
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-xs font-semibold">Fully Paid</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-bold text-emerald-900 mt-1">{fullyPaidBookings.length}</div>
              <span className="text-[10px] text-emerald-700">Zero balance</span>
            </button>

          </div>
        </div>

      </div>

      {/* Per-Staff Outstanding Balance Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <Users className="w-4 h-4 text-indigo-600 mr-2" />
              Per-Staff Outstanding Balance Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track pending payments and collection efficiency assigned to each staff member
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Bookings</th>
                <th className="py-3 px-4">With Pending Balance</th>
                <th className="py-3 px-4">Total Collected</th>
                <th className="py-3 px-4">Pending Outstanding Balance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffBreakdown.map((s) => (
                <tr key={s.staffId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800 flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200">
                      {s.staffName.charAt(0)}
                    </div>
                    <span>{s.staffName}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                      s.staffRole === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {s.staffRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {s.totalCount} records
                  </td>
                  <td className="py-3 px-4 font-semibold text-amber-700">
                    {s.pendingCount} records
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    ₹{s.totalCollected.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 font-bold text-rose-700">
                    ₹{s.totalPending.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedStaffFilter(selectedStaffFilter === s.staffId ? 'ALL' : s.staffId)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedStaffFilter === s.staffId
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {selectedStaffFilter === s.staffId ? 'Showing Assigned' : 'Filter Bookings'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bookings Payment Inspection Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        
        {/* Table Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center">
              <CreditCard className="w-4 h-4 text-emerald-600 mr-2" />
              Bookings Ledger ({filteredBookings.length})
            </h3>
            <p className="text-xs text-slate-500">Click any booking row to open payment details or add a payment entry</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search customer, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="Unpaid">Unpaid Only</option>
              <option value="Partially Paid">Partially Paid Only</option>
              <option value="Fully Paid">Fully Paid Only</option>
            </select>

            {/* Staff Filter */}
            <select
              value={selectedStaffFilter}
              onChange={(e) => setSelectedStaffFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
            >
              <option value="ALL">All Assigned Staff</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {(selectedStatusFilter !== 'ALL' || selectedStaffFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedStatusFilter('ALL');
                  setSelectedStaffFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Reset
              </button>
            )}

          </div>
        </div>

        {/* Ledger Table */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No bookings match the selected payment filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Customer / Applicant</th>
                  <th className="py-3 px-3">Booking Status</th>
                  <th className="py-3 px-3">Assigned Staff</th>
                  <th className="py-3 px-3">Total Billed</th>
                  <th className="py-3 px-3">Amount Paid</th>
                  <th className="py-3 px-3">Balance Due</th>
                  <th className="py-3 px-3">Payment Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const isTicket = b.type === 'ticket';
                  const bookingStatus = isTicket ? (b as TicketBooking).ticketStatus : (b as PassportProcess).passportStatus;

                  return (
                    <tr
                      key={b.id}
                      onClick={() => onSelectBooking(b)}
                      className="hover:bg-slate-50/90 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          isTicket ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isTicket ? 'TICKET' : 'PASSPORT'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        <div>{b.customerOrApplicantName}</div>
                        <div className="text-[10px] font-normal text-slate-500">{b.mobileNumber}</div>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {bookingStatus}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {getStaffName(b.assignedStaffId)}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        ₹{(b.amountPaid || 0).toLocaleString('en-IN')}
                      </td>

                      <td className={`py-2.5 px-3 font-bold ${
                        (b.balanceDue || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        ₹{(b.balanceDue || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          b.paymentStatus === 'Fully Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.paymentStatus === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {b.paymentStatus || 'Unpaid'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBooking(b);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                        >
                          Manage Payments
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
