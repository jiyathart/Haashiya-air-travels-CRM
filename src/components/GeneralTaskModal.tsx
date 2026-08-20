import React, { useState, useEffect } from 'react';
import { GeneralTask, GeneralTaskStatus, StaffUser } from '../types';
import { X, Calendar, User, Phone, FileText, DollarSign, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

interface GeneralTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: GeneralTask | null;
  staffList: StaffUser[];
  serviceTypes: string[];
  currentUser: StaffUser;
  onSave: (data: any) => Promise<void>;
  onAddServiceType?: (newType: string) => Promise<void>;
}

export const GeneralTaskModal: React.FC<GeneralTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  staffList,
  serviceTypes,
  currentUser,
  onSave,
  onAddServiceType
}) => {
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [showAddCustomType, setShowAddCustomType] = useState(false);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<GeneralTaskStatus>('Enquiry');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>(0);
  const [noteText, setNoteText] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setCustomerName(task.customerName || '');
      setMobileNumber(task.mobileNumber || '');
      setServiceType(task.serviceType || '');
      setDescription(task.description || '');
      setStatus(task.status || 'Enquiry');
      setAssignedStaffId(task.assignedStaffId || currentUser.id);
      setDueDate(task.dueDate || '');
      setTotalAmount(task.totalAmount || 0);
      setNoteText('');
    } else {
      setCustomerName('');
      setMobileNumber('');
      setServiceType(serviceTypes[0] || 'PAN Card');
      setDescription('');
      setStatus('Enquiry');
      setAssignedStaffId(currentUser.id);
      setDueDate('');
      setTotalAmount('');
      setNoteText('');
    }
    setError(null);
    setShowAddCustomType(false);
  }, [task, isOpen, currentUser, serviceTypes]);

  if (!isOpen) return null;

  const handleCreateCustomType = async () => {
    if (!customServiceInput.trim()) return;
    try {
      if (onAddServiceType) {
        await onAddServiceType(customServiceInput.trim());
      }
      setServiceType(customServiceInput.trim());
      setCustomServiceInput('');
      setShowAddCustomType(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add custom service type');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (!serviceType) {
      setError('Service type is required');
      return;
    }
    if (!assignedStaffId) {
      setError('Assigned staff is required');
      return;
    }

    // Payment validation check for completion
    if ((status === 'Ready / Completed' || status === 'Delivered') && task) {
      if (task.paymentStatus !== 'Fully Paid' && currentUser.role === 'Staff') {
        setError(`Cannot mark task "${status}" while payment balance (₹${task.balanceDue}) remains unpaid.`);
        return;
      }
    }

    try {
      setSaving(true);
      await onSave({
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        serviceType: serviceType.trim(),
        description: description.trim(),
        status,
        assignedStaffId,
        dueDate: dueDate || undefined,
        totalAmount: totalAmount === '' ? 0 : Number(totalAmount),
        noteText: noteText.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save general task');
    } finally {
      setSaving(false);
    }
  };

  const activeStaff = staffList.filter(s => s.status === 'active');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {task ? `Edit General Task: ${task.customerName}` : 'New General / e-Sevai Service Task'}
              </h2>
              <p className="text-amber-100 text-xs mt-0.5">
                {task ? `ID: ${task.id}` : 'Create a flexible service request or e-Sevai process'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Customer Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Karthik Subramanian"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98401 22334"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Service Type Selection with Add New Option */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Service Type *
              </label>
              <button
                type="button"
                onClick={() => setShowAddCustomType(!showAddCustomType)}
                className="text-amber-700 hover:text-amber-900 text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddCustomType ? 'Select Existing' : 'Add New Service Type'}</span>
              </button>
            </div>

            {showAddCustomType ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. EC / Encumbrance Certificate"
                  value={customServiceInput}
                  onChange={e => setCustomServiceInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateCustomType}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Save Type
                </button>
              </div>
            ) : (
              <select
                value={serviceType}
                onChange={e => setServiceType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              >
                {serviceTypes.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            )}
          </div>

          {/* Status & Assigned Staff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as GeneralTaskStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white font-medium"
              >
                <option value="Enquiry">Enquiry</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted / Awaiting Approval">Submitted / Awaiting Approval</option>
                <option value="Action Needed">Action Needed</option>
                <option value="Ready / Completed">Ready / Completed</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Staff Member *
              </label>
              <select
                value={assignedStaffId}
                onChange={e => setAssignedStaffId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white font-medium"
              >
                {activeStaff.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Service Fee / Total Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Due Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Service Fee (₹)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Specific Requirements
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Application details, document reference numbers, specific portal remarks..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Note Text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Add Work Note / Activity Log
            </label>
            <input
              type="text"
              placeholder="e.g. Customer provided photo copy. Submitted on TN e-Sevai portal."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
