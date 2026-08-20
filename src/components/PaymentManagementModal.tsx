import React, { useState, useEffect } from 'react';
import { TicketBooking, PassportProcess, GeneralTask, StaffUser, PaymentMode, PaymentEntry } from '../types';
import { CreditCard, Plus, Trash2, Edit2, ShieldAlert, CheckCircle2, AlertCircle, Clock, DollarSign, Wallet, FileText, UserCheck } from 'lucide-react';
import { formatDateLabel, formatDateTimeLabel } from '../utils/dateUtils';

interface PaymentManagementModalProps {
  isOpen: boolean;
  booking: TicketBooking | PassportProcess | GeneralTask | null;
  currentUser: StaffUser;
  onClose: () => void;
  onPaymentAdded: (
    bookingId: string,
    bookingType: 'ticket' | 'passport' | 'general',
    paymentData: { date: string; amount: number; mode: PaymentMode; note?: string }
  ) => Promise<void>;
  onPaymentUpdated: (
    bookingId: string,
    bookingType: 'ticket' | 'passport' | 'general',
    paymentId: string,
    paymentData: { date?: string; amount?: number; mode?: PaymentMode; note?: string }
  ) => Promise<void>;
  onPaymentDeleted: (
    bookingId: string,
    bookingType: 'ticket' | 'passport' | 'general',
    paymentId: string
  ) => Promise<void>;
  onTotalAmountUpdated: (
    bookingId: string,
    bookingType: 'ticket' | 'passport' | 'general',
    totalAmount: number
  ) => Promise<void>;
}

export const PaymentManagementModal: React.FC<PaymentManagementModalProps> = ({
  isOpen,
  booking,
  currentUser,
  onClose,
  onPaymentAdded,
  onPaymentUpdated,
  onPaymentDeleted,
  onTotalAmountUpdated,
}) => {
  const [totalAmountInput, setTotalAmountInput] = useState<string>('0');
  const [isEditingTotal, setIsEditingTotal] = useState(false);

  // New Payment Form State
  const [payDate, setPayDate] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMode, setPayMode] = useState<PaymentMode>('UPI');
  const [payNote, setPayNote] = useState<string>('');

  // Editing Existing Payment (Admin Only)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPayDate, setEditPayDate] = useState<string>('');
  const [editPayAmount, setEditPayAmount] = useState<string>('');
  const [editPayMode, setEditPayMode] = useState<PaymentMode>('Cash');
  const [editPayNote, setEditPayNote] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (booking) {
      setTotalAmountInput(String(booking.totalAmount || 0));
      setPayDate(new Date().toISOString().split('T')[0]);
      setPayAmount('');
      setPayMode('UPI');
      setPayNote('');
      setEditingPaymentId(null);
      setIsEditingTotal(false);
      setError('');
      setSuccessMsg('');
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const bookingName = booking.type === 'ticket' 
    ? (booking as TicketBooking).customerName 
    : booking.type === 'passport'
    ? (booking as PassportProcess).applicantName
    : (booking as GeneralTask).customerName;

  const bookingSubtitle = booking.type === 'ticket'
    ? `Flight: ${(booking as TicketBooking).airline} ${(booking as TicketBooking).flightNumber} | PNR: ${(booking as TicketBooking).pnr || 'N/A'}`
    : booking.type === 'passport'
    ? `Service: ${(booking as PassportProcess).serviceType} | Ref: ${(booking as PassportProcess).applicationNumber || 'N/A'}`
    : `Service: ${(booking as GeneralTask).serviceType}`;

  const currentStatus = booking.type === 'ticket' 
    ? (booking as TicketBooking).ticketStatus 
    : booking.type === 'passport'
    ? (booking as PassportProcess).passportStatus
    : (booking as GeneralTask).status;

  const isCompletedOrDelivered = currentStatus === 'Completed' || currentStatus === 'Delivered' || currentStatus === 'Ready / Completed';

  const handleUpdateTotalAmount = async () => {
    const parsed = Math.max(0, Number(totalAmountInput) || 0);
    setLoading(true);
    setError('');
    try {
      await onTotalAmountUpdated(booking.id, booking.type, parsed);
      setIsEditingTotal(false);
      setSuccessMsg('Total amount updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update total amount');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const parsedAmt = Number(payAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Please enter a valid positive payment amount');
      return;
    }

    setLoading(true);
    try {
      await onPaymentAdded(booking.id, booking.type, {
        date: payDate || new Date().toISOString().split('T')[0],
        amount: parsedAmt,
        mode: payMode,
        note: payNote.trim() ? payNote.trim() : undefined
      });
      setPayAmount('');
      setPayNote('');
      setSuccessMsg(`Payment of ₹${parsedAmt.toLocaleString('en-IN')} recorded successfully`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const startEditPayment = (p: PaymentEntry) => {
    setEditingPaymentId(p.id);
    setEditPayDate(p.date);
    setEditPayAmount(String(p.amount));
    setEditPayMode(p.mode);
    setEditPayNote(p.note || '');
  };

  const handleSavePaymentEdit = async (paymentId: string) => {
    const parsedAmt = Number(editPayAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Please enter a valid positive amount for edited payment');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onPaymentUpdated(booking.id, booking.type, paymentId, {
        date: editPayDate,
        amount: parsedAmt,
        mode: editPayMode,
        note: editPayNote.trim()
      });
      setEditingPaymentId(null);
      setSuccessMsg('Payment entry updated successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update payment entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment entry? This will adjust running total and balance due.')) return;
    setLoading(true);
    setError('');
    try {
      await onPaymentDeleted(booking.id, booking.type, paymentId);
      setSuccessMsg('Payment entry deleted successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete payment entry');
    } finally {
      setLoading(false);
    }
  };

  // Payment Status Badge Colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Fully Paid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Fully Paid
          </span>
        );
      case 'Partially Paid':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Partially Paid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Unpaid
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-600/80 rounded-xl">
              <CreditCard className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold">Payment & Billing Tracker</h3>
                {getStatusBadge(booking.paymentStatus || 'Unpaid')}
              </div>
              <p className="text-xs text-emerald-200 mt-0.5">
                {bookingName} • {bookingSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/50 transition-colors"
            title="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Completion Warning if unpaid balance */}
          {booking.balanceDue > 0 && isCompletedOrDelivered && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm rounded-xl flex items-start space-x-2.5 shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pending Balance Warning:</span> This booking is marked as <span className="font-semibold">{currentStatus}</span>, but still has an outstanding balance of <span className="font-bold text-amber-900">₹{booking.balanceDue.toLocaleString('en-IN')}</span>. Staff cannot transition records to {booking.type === 'ticket' ? 'Completed' : 'Delivered'} until fully paid.
              </div>
            </div>
          )}

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Total Amount Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Total Amount</span>
                {currentUser.role === 'Admin' && !isEditingTotal && (
                  <button
                    onClick={() => setIsEditingTotal(true)}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-medium underline flex items-center"
                  >
                    <Edit2 className="w-3 h-3 mr-0.5" /> Edit
                  </button>
                )}
              </div>
              {isEditingTotal ? (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm font-bold text-slate-600">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={totalAmountInput}
                    onChange={(e) => setTotalAmountInput(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <button
                    onClick={handleUpdateTotalAmount}
                    disabled={loading}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="text-xl font-black text-slate-800">
                  ₹{(booking.totalAmount || 0).toLocaleString('en-IN')}
                </div>
              )}
              <p className="text-[11px] text-slate-500 mt-0.5">Base price & charges</p>
            </div>

            {/* Amount Paid Card */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
              <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                Amount Paid
              </div>
              <div className="text-xl font-black text-emerald-700">
                ₹{(booking.amountPaid || 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5">
                {booking.payments?.length || 0} payment entries
              </p>
            </div>

            {/* Balance Due Card */}
            <div className={`p-4 rounded-xl border ${
              booking.balanceDue > 0 
                ? 'bg-rose-50/70 border-rose-200' 
                : 'bg-emerald-50/40 border-emerald-200'
            }`}>
              <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                booking.balanceDue > 0 ? 'text-rose-800' : 'text-emerald-800'
              }`}>
                Balance Due
              </div>
              <div className={`text-xl font-black ${
                booking.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}>
                ₹{(booking.balanceDue || 0).toLocaleString('en-IN')}
              </div>
              <p className={`text-[11px] ${booking.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'} mt-0.5`}>
                {booking.balanceDue > 0 ? 'Outstanding balance' : 'Fully settled'}
              </p>
            </div>

          </div>

          {/* Record New Payment Form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
              <Plus className="w-4 h-4 text-emerald-600 mr-1.5" />
              Record New Payment Entry
            </h4>
            <form onSubmit={handleAddPaymentSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Date</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 5000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="UPI">UPI / GooglePay</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Advance / Final settlement"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="sm:col-span-4 flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{loading ? 'Processing...' : 'Add Payment Entry'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Payment History List */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-2.5 flex items-center justify-between">
              <span>Payment Entry History ({booking.payments?.length || 0})</span>
              <span className="text-xs font-normal text-slate-500">Auto-updates balance & status</span>
            </h4>

            {(!booking.payments || booking.payments.length === 0) ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <p className="text-xs text-slate-500 font-medium">No payments recorded for this booking yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Use the form above to add an initial advance or full payment.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3">Received By</th>
                        <th className="py-2.5 px-3">Note</th>
                        {currentUser.role === 'Admin' && <th className="py-2.5 px-3 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {booking.payments.map((p) => {
                        const isEditing = editingPaymentId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            {isEditing ? (
                              <td colSpan={currentUser.role === 'Admin' ? 6 : 5} className="p-3 bg-amber-50/50">
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500">Date</label>
                                    <input
                                      type="date"
                                      value={editPayDate}
                                      onChange={(e) => setEditPayDate(e.target.value)}
                                      className="w-full p-1 text-xs border border-slate-300 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500">Amount (₹)</label>
                                    <input
                                      type="number"
                                      value={editPayAmount}
                                      onChange={(e) => setEditPayAmount(e.target.value)}
                                      className="w-full p-1 text-xs border border-slate-300 rounded font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500">Mode</label>
                                    <select
                                      value={editPayMode}
                                      onChange={(e) => setEditPayMode(e.target.value as PaymentMode)}
                                      className="w-full p-1 text-xs border border-slate-300 rounded"
                                    >
                                      <option value="UPI">UPI</option>
                                      <option value="Cash">Cash</option>
                                      <option value="Bank Transfer">Bank Transfer</option>
                                      <option value="Card">Card</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500">Note</label>
                                    <input
                                      type="text"
                                      value={editPayNote}
                                      onChange={(e) => setEditPayNote(e.target.value)}
                                      className="w-full p-1 text-xs border border-slate-300 rounded"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <button
                                    onClick={() => setEditingPaymentId(null)}
                                    className="px-2.5 py-1 text-xs text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSavePaymentEdit(p.id)}
                                    disabled={loading}
                                    className="px-3 py-1 text-xs text-white bg-emerald-600 rounded font-bold hover:bg-emerald-700"
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                                  {formatDateLabel(p.date)}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-emerald-700 whitespace-nowrap">
                                  ₹{p.amount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                    {p.mode}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                  <span className="flex items-center text-xs">
                                    <UserCheck className="w-3 h-3 text-slate-400 mr-1" />
                                    {p.receivedByStaffName || 'Staff'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                                  {p.note || '—'}
                                </td>
                                {currentUser.role === 'Admin' && (
                                  <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                                    <button
                                      onClick={() => startEditPayment(p)}
                                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                      title="Edit payment entry"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeletePayment(p.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                      title="Delete payment entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                )}
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500">
            Last updated: {formatDateTimeLabel(booking.updatedAt)}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-semibold text-xs rounded-xl hover:bg-slate-900 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
