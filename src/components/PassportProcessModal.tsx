import React, { useState, useEffect } from 'react';
import { PassportProcess, StaffUser, PassportStatus, PassportServiceType } from '../types';
import { formatDateLabel, formatDateTimeLabel } from '../utils/dateUtils';
import { FileText, X, Clock, MessageSquare, History, User, Phone, MapPin, AlertCircle } from 'lucide-react';

interface PassportProcessModalProps {
  isOpen: boolean;
  passport: PassportProcess | null;
  staffList: StaffUser[];
  currentUser: StaffUser;
  onClose: () => void;
  onSave: (data: Partial<PassportProcess> & { noteText?: string }) => Promise<void>;
}

export const PassportProcessModal: React.FC<PassportProcessModalProps> = ({
  isOpen,
  passport,
  staffList,
  currentUser,
  onClose,
  onSave
}) => {
  const [applicantName, setApplicantName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [serviceType, setServiceType] = useState<PassportServiceType>('Fresh');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [passportSevaKendra, setPassportSevaKendra] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [passportStatus, setPassportStatus] = useState<PassportStatus>('Application Submitted');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [noteText, setNoteText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'history'>('details');

  const activeStaff = staffList.filter(s => s.status === 'active');

  useEffect(() => {
    if (passport) {
      setApplicantName(passport.applicantName || '');
      setMobileNumber(passport.mobileNumber || '');
      setServiceType(passport.serviceType || 'Fresh');
      setApplicationNumber(passport.applicationNumber || '');
      setPassportSevaKendra(passport.passportSevaKendra || '');
      setAppointmentDate(passport.appointmentDate || '');
      setAppointmentTime(passport.appointmentTime || '');
      setPassportStatus(passport.passportStatus || 'Application Submitted');
      setAssignedStaffId(passport.assignedStaffId || '');
      setTotalAmount(passport.totalAmount || 0);
      setNoteText('');
    } else {
      setApplicantName('');
      setMobileNumber('');
      setServiceType('Fresh');
      setApplicationNumber('');
      setPassportSevaKendra('PSK Connaught Place, New Delhi');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      setAppointmentDate(tomorrow.toISOString().split('T')[0]);
      setAppointmentTime('11:00');
      setPassportStatus('Application Submitted');
      setAssignedStaffId(currentUser.id || (activeStaff[0]?.id || ''));
      setTotalAmount(4500);
      setNoteText('');
    }
    setError('');
    setActiveTab('details');
  }, [passport, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!applicantName.trim()) {
      setError('Applicant name is required');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (!assignedStaffId) {
      setError('Every passport process must be assigned to an active staff member');
      return;
    }

    // Payment constraint check
    if (passportStatus === 'Delivered' && passport && passport.paymentStatus !== 'Fully Paid' && currentUser.role === 'Staff') {
      setError(`Cannot mark passport as 'Delivered' while payment status is ${passport.paymentStatus || 'Unpaid'}. Admin override required.`);
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: passport?.id,
        applicantName: applicantName.trim(),
        mobileNumber: mobileNumber.trim(),
        serviceType,
        applicationNumber: applicationNumber.trim(),
        passportSevaKendra: passportSevaKendra.trim(),
        appointmentDate,
        appointmentTime,
        passportStatus,
        assignedStaffId,
        totalAmount: Math.max(0, Number(totalAmount) || 0),
        noteText: noteText.trim() ? noteText.trim() : undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save passport process');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!passport || !noteText.trim()) return;
    setLoading(true);
    try {
      await onSave({
        id: passport.id,
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
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 to-blue-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/80 rounded-xl">
              <FileText className="w-6 h-6 text-indigo-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {passport ? `Edit Passport: ${passport.applicantName}` : 'New Passport Application'}
              </h3>
              <p className="text-xs text-indigo-200">
                {passport ? `App No: ${passport.applicationNumber || 'N/A'} | Stage: ${passport.passportStatus}` : 'Passport Seva Kendra process tracker'}
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

        {/* Modal Tabs */}
        {passport && (
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0 text-xs font-medium text-slate-600 space-x-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 border-b-2 transition ${
                activeTab === 'details'
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Passport Details
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2 border-b-2 transition flex items-center gap-1 ${
                activeTab === 'notes'
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Notes Log ({passport.notes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 border-b-2 transition flex items-center gap-1 ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Stage Audit Trail ({passport.statusHistory?.length || 0})
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
            <form id="passport-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Applicant Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Applicant Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Farhan Akhtar"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
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
                      placeholder="e.g. +91 98980 12345"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Service Type, Application Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Service Type
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as PassportServiceType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                  >
                    <option value="Fresh">Fresh Passport</option>
                    <option value="Renewal">Renewal / Re-issue</option>
                    <option value="Tatkal">Tatkal (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Application Reference Number (ARN)
                  </label>
                  <input
                    type="text"
                    value={applicationNumber}
                    onChange={(e) => setApplicationNumber(e.target.value)}
                    placeholder="e.g. 24-100892301"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-mono"
                  />
                </div>
              </div>

              {/* Passport Seva Kendra (PSK) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Passport Seva Kendra (PSK Location)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={passportSevaKendra}
                    onChange={(e) => setPassportSevaKendra(e.target.value)}
                    placeholder="e.g. PSK Connaught Place, New Delhi"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Appointment Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Appointment Date
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Appointment Time
                  </label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Stage Pipeline, Assigned Staff & Total Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Passport Process Stage Pipeline
                  </label>
                  <select
                    value={passportStatus}
                    onChange={(e) => setPassportStatus(e.target.value as PassportStatus)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-medium"
                  >
                    <option value="Application Submitted">Application Submitted</option>
                    <option value="Appointment Booked">Appointment Booked</option>
                    <option value="Biometric Done">Biometric Done</option>
                    <option value="Police Verification">Police Verification</option>
                    <option value="Printing">Printing</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Staff Member *
                  </label>
                  <select
                    required
                    value={assignedStaffId}
                    disabled={currentUser.role !== 'Admin' && passport?.assignedStaffId !== currentUser.id}
                    onChange={(e) => setAssignedStaffId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-slate-100"
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
                    Total Fee / Charge (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                    placeholder="e.g. 4500"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent font-bold text-slate-800"
                  />
                </div>
              </div>

              {!passport && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Initial Note / Document Checklist (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g. Original Aadhaar card & 10th marksheet checked."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
              )}

            </form>
          )}

          {/* Notes Log Tab */}
          {activeTab === 'notes' && passport && (
            <div className="space-y-4">
              
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-semibold text-slate-700 text-xs">
                  Add Timestamped Note
                </label>
                <textarea
                  rows={2}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type note log here..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || loading}
                    className="px-3 py-1.5 bg-indigo-800 text-white rounded-lg text-xs font-medium hover:bg-indigo-900 disabled:opacity-50"
                  >
                    Post Note
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {passport.notes && passport.notes.length > 0 ? (
                  passport.notes.map((n) => (
                    <div key={n.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-indigo-600" /> {n.staffName}
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
          {activeTab === 'history' && passport && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-600" /> Stage Audit Trail History
              </h4>
              <div className="relative border-l-2 border-indigo-200 ml-3 pl-4 space-y-3">
                {passport.statusHistory && passport.statusHistory.length > 0 ? (
                  passport.statusHistory.map((h) => (
                    <div key={h.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-900">
                            {h.oldStatus} → <span className="text-indigo-700 font-bold">{h.newStatus}</span>
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
                  <p className="text-slate-400 text-xs">No stage changes recorded yet.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {passport ? `Created: ${formatDateLabel(passport.createdAt.split('T')[0])}` : 'All changes persist immediately'}
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
              form="passport-form"
              disabled={loading}
              className="px-5 py-2 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : passport ? 'Update Passport Process' : 'Create Passport Process'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
