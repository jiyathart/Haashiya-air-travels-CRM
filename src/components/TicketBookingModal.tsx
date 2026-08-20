import React, { useState, useEffect } from 'react';
import { TicketBooking, StaffUser, TicketStatus, FlightType } from '../types';
import { calculateReportingDateTime, formatDateLabel, formatDateTimeLabel } from '../utils/dateUtils';
import { Ticket, X, Clock, MessageSquare, History, User, Phone, Plane, AlertCircle } from 'lucide-react';

interface TicketBookingModalProps {
  isOpen: boolean;
  ticket: TicketBooking | null;
  staffList: StaffUser[];
  currentUser: StaffUser;
  onClose: () => void;
  onSave: (data: Partial<TicketBooking> & { noteText?: string }) => Promise<void>;
}

export const TicketBookingModal: React.FC<TicketBookingModalProps> = ({
  isOpen,
  ticket,
  staffList,
  currentUser,
  onClose,
  onSave
}) => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [airline, setAirline] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [pnr, setPnr] = useState('');
  const [flightType, setFlightType] = useState<FlightType>('International');
  const [departureAirport, setDepartureAirport] = useState('');
  const [arrivalAirport, setArrivalAirport] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('Enquiry');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [noteText, setNoteText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'history'>('details');

  const activeStaff = staffList.filter(s => s.status === 'active');

  useEffect(() => {
    if (ticket) {
      setCustomerName(ticket.customerName || '');
      setMobileNumber(ticket.mobileNumber || '');
      setAirline(ticket.airline || '');
      setFlightNumber(ticket.flightNumber || '');
      setPnr(ticket.pnr || '');
      setFlightType(ticket.flightType || 'International');
      setDepartureAirport(ticket.departureAirport || '');
      setArrivalAirport(ticket.arrivalAirport || '');
      setDepartureDate(ticket.departureDate || '');
      setDepartureTime(ticket.departureTime || '');
      setTicketStatus(ticket.ticketStatus || 'Enquiry');
      setAssignedStaffId(ticket.assignedStaffId || '');
      setTotalAmount(ticket.totalAmount || 0);
      setNoteText('');
    } else {
      setCustomerName('');
      setMobileNumber('');
      setAirline('');
      setFlightNumber('');
      setPnr('');
      setFlightType('International');
      setDepartureAirport('DEL (Delhi)');
      setArrivalAirport('DXB (Dubai)');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDepartureDate(tomorrow.toISOString().split('T')[0]);
      setDepartureTime('10:00');
      setTicketStatus('Enquiry');
      setAssignedStaffId(currentUser.id || (activeStaff[0]?.id || ''));
      setTotalAmount(25000);
      setNoteText('');
    }
    setError('');
    setActiveTab('details');
  }, [ticket, isOpen]);

  if (!isOpen) return null;

  // Real-time calculated reporting date and time
  const reporting = calculateReportingDateTime(departureDate, departureTime, flightType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (!assignedStaffId) {
      setError('Every booking must be assigned to an active staff member');
      return;
    }

    // Payment validation constraint
    if (ticketStatus === 'Completed' && ticket && ticket.paymentStatus !== 'Fully Paid' && currentUser.role === 'Staff') {
      setError(`Cannot mark booking as 'Completed' while payment status is ${ticket.paymentStatus || 'Unpaid'}. Admin override required.`);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: ticket?.id,
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        airline: airline.trim(),
        flightNumber: flightNumber.trim(),
        pnr: pnr.trim().toUpperCase(),
        flightType,
        departureAirport: departureAirport.trim(),
        arrivalAirport: arrivalAirport.trim(),
        departureDate,
        departureTime,
        ticketStatus,
        assignedStaffId,
        totalAmount: Math.max(0, Number(totalAmount) || 0),
        noteText: noteText.trim() ? noteText.trim() : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save ticket booking');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!ticket || !noteText.trim()) return;
    setLoading(true);
    try {
      await onSave({
        id: ticket.id,
        noteText: noteText.trim()
      });
      setNoteText('');
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/80 rounded-xl">
              <Ticket className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {ticket ? `Edit Ticket: ${ticket.customerName}` : 'New Flight Ticket Booking'}
              </h3>
              <p className="text-xs text-blue-200">
                {ticket ? `PNR: ${ticket.pnr || 'N/A'} | Status: ${ticket.ticketStatus}` : 'Enter passenger flight booking details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs (Detail, Notes, History) */}
        {ticket && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0 text-xs font-medium text-slate-600 space-x-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 border-b-2 transition ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Ticket Details
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2 border-b-2 transition flex items-center gap-1 ${
                activeTab === 'notes'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Notes Log ({ticket.notes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 border-b-2 transition flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Status Audit Trail ({ticket.statusHistory?.length || 0})
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {activeTab === 'details' && (
            <form id="ticket-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Customer Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Mohammed Zameer"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="e.g. +91 98765 11223"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Airline, Flight No, PNR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Airline
                  </label>
                  <input
                    type="text"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    placeholder="e.g. Emirates / IndiGo"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Flight Number
                  </label>
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="e.g. EK-501"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PNR Number
                  </label>
                  <input
                    type="text"
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value.toUpperCase())}
                    placeholder="e.g. EM789X"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent uppercase font-mono font-bold"
                  />
                </div>
              </div>

              {/* Flight Type & Airports */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Flight Type
                  </label>
                  <select
                    value={flightType}
                    onChange={(e) => setFlightType(e.target.value as FlightType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="International">International (-3h Reporting)</option>
                    <option value="Domestic">Domestic (-2h Reporting)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Departure Airport
                  </label>
                  <input
                    type="text"
                    value={departureAirport}
                    onChange={(e) => setDepartureAirport(e.target.value)}
                    placeholder="e.g. DEL (New Delhi)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Arrival Airport
                  </label>
                  <input
                    type="text"
                    value={arrivalAirport}
                    onChange={(e) => setArrivalAirport(e.target.value)}
                    placeholder="e.g. DXB (Dubai)"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Departure Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Departure Time (24h)
                  </label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* AUTO REPORTING TIME HIGHLIGHT BOX */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs">Auto Reporting Time:</span>
                    <p className="text-xs font-mono font-semibold">
                      {reporting.reportingDate ? `${formatDateLabel(reporting.reportingDate)} at ${reporting.reportingTime}` : 'Enter departure date/time'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                  {flightType === 'International' ? '-3 Hours' : '-2 Hours'}
                </span>
              </div>

              {/* Status, Assigned Staff & Total Billing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ticket Status Pipeline
                  </label>
                  <select
                    value={ticketStatus}
                    onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                  >
                    <option value="Enquiry">Enquiry</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Ticketed">Ticketed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Staff Member *
                  </label>
                  <select
                    required
                    value={assignedStaffId}
                    disabled={currentUser.role !== 'Admin' && ticket?.assignedStaffId !== currentUser.id}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-slate-100"
                  >
                    <option value="">-- Select Active Staff --</option>
                    {activeStaff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* New Note Prompt on Creation */}
              {!ticket && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Note / Special Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Passenger requested veg meal, passport scan attached."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
              )}

            </form>
          )}

          {/* Notes Log Tab */}
          {activeTab === 'notes' && ticket && (
            <div className="space-y-4">
              
              {/* Add Note Input */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-semibold text-slate-700 text-xs">
                  Add Timestamped Note
                </label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type note log here..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || loading}
                    className="px-3 py-1.5 bg-blue-800 text-white rounded-lg text-xs font-medium hover:bg-blue-900 disabled:opacity-50"
                  >
                    Post Note
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-2">
                {ticket.notes && ticket.notes.length > 0 ? (
                  ticket.notes.map((n) => (
                    <div key={n.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-600" /> {n.staffName}
                        </span>
                        <span>{formatDateTimeLabel(n.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap">{n.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-6">No notes recorded yet.</p>
                )}
              </div>

            </div>
          )}

          {/* Audit Trail History Tab */}
          {activeTab === 'history' && ticket && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" /> Status Change History & Audit Logs
              </h4>
              <div className="relative border-l-2 border-blue-200 ml-3 pl-4 space-y-3">
                {ticket.statusHistory && ticket.statusHistory.length > 0 ? (
                  ticket.statusHistory.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white" />
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-900">
                            {h.oldStatus} → <span className="text-blue-700 font-bold">{h.newStatus}</span>
                          </span>
                          <span>{formatDateTimeLabel(h.timestamp)}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Changed by: <span className="font-medium text-slate-800">{h.changedByStaffName}</span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs">No status changes recorded yet.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {ticket ? `Created: ${formatDateLabel(ticket.createdAt.split('T')[0])}` : 'All changes persist immediately'}
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="ticket-form"
              disabled={loading}
              className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : ticket ? 'Update Ticket' : 'Create Ticket Booking'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
