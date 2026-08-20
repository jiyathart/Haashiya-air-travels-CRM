import React, { useState } from 'react';
import { FollowUp, Agent, StaffUser, UserRole } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  Clock, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Calendar, 
  UserCheck, 
  X,
  Filter,
  CheckCircle2,
  User
} from 'lucide-react';

interface FollowUpManagementProps {
  followUps: FollowUp[];
  agents: Agent[];
  staffList?: StaffUser[];
  userRole: UserRole;
  onRefresh: () => void;
}

export function FollowUpManagement({ followUps, agents, staffList = [], userRole, onRefresh }: FollowUpManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Completed' | 'Cancelled'>('Pending');
  const [notes, setNotes] = useState('');
  const [agentId, setAgentId] = useState('');

  const openAddModal = () => {
    setSelectedFollowUp(null);
    setTitle('');
    setCustomerName('');
    setMobileNumber('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledAt(tomorrow.toISOString().slice(0, 16));
    setStatus('Pending');
    setNotes('');
    const defaultAssignee = staffList[0]?.id || agents[0]?.id || '';
    setAgentId(defaultAssignee);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (fu: FollowUp) => {
    setSelectedFollowUp(fu);
    setTitle(fu.title);
    setCustomerName(fu.customer_name);
    setMobileNumber(fu.mobile_number);
    setScheduledAt(fu.scheduled_at ? fu.scheduled_at.slice(0, 16) : '');
    setStatus(fu.status);
    setNotes(fu.notes || '');
    setAgentId(fu.agent_id || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openViewModal = (fu: FollowUp) => {
    setSelectedFollowUp(fu);
    setIsViewOpen(true);
  };

  const openDeleteModal = (fu: FollowUp) => {
    setSelectedFollowUp(fu);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleSaveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !customerName.trim() || !mobileNumber.trim() || !scheduledAt) {
      setFormError('Title, Customer Name, Mobile Number, and Scheduled Date are required.');
      return;
    }

    // Determine assignee details
    let assignedName = 'Unassigned';
    let assignedCode = 'N/A';
    if (agentId) {
      const foundStaff = staffList.find(s => s.id === agentId);
      if (foundStaff) {
        assignedName = foundStaff.full_name || foundStaff.name || foundStaff.email;
        assignedCode = foundStaff.staff_code || 'STAFF';
      } else {
        const foundAgent = agents.find(a => a.id === agentId);
        if (foundAgent) {
          assignedName = foundAgent.full_name;
          assignedCode = foundAgent.agent_id;
        }
      }
    }

    try {
      setLoading(true);
      const payload = {
        title,
        customer_name: customerName,
        mobile_number: mobileNumber,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status,
        notes,
        agent_id: agentId || null,
        agent_name: assignedName,
        agent_code: assignedCode
      };

      if (selectedFollowUp) {
        await supabaseService.updateFollowUp(selectedFollowUp.id, payload);
      } else {
        await supabaseService.createFollowUp(payload);
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save follow-up task.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (fu: FollowUp) => {
    try {
      await supabaseService.updateFollowUp(fu.id, { status: 'Completed' });
      onRefresh();
    } catch (err) {
      console.error('Error marking completed:', err);
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!selectedFollowUp) return;
    try {
      await supabaseService.deleteFollowUp(selectedFollowUp.id, reason, 'admin');
      setIsDeleteOpen(false);
      onRefresh();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete follow-up.');
      throw err;
    }
  };

  const filteredFollowUps = followUps.filter(f => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.mobile_number.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || f.agent_id === agentFilter;

    return matchesSearch && matchesStatus && matchesAgent;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Follow-up Scheduler</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Schedule follow-up calls, visa appointment reminders, and payment check-ins for agents.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Follow-up</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Title, Customer Name, Mobile..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Staff & Agents</option>
            {staffList.length > 0 && (
              <optgroup label="Staff Members">
                {staffList.map(s => (
                  <option key={`stf-${s.id}`} value={s.id}>
                    {s.full_name || s.name} ({s.staff_code || 'Staff'})
                  </option>
                ))}
              </optgroup>
            )}
            {agents.length > 0 && (
              <optgroup label="External Agents">
                {agents.map(a => (
                  <option key={`agt-${a.id}`} value={a.id}>
                    {a.full_name} ({a.agent_id})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Task / Title</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredFollowUps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No follow-ups scheduled.
                  </td>
                </tr>
              ) : (
                filteredFollowUps.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-slate-900 font-bold whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        <span>{new Date(f.scheduled_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {f.title}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-semibold text-slate-800">{f.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{f.mobile_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        f.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        f.status === 'Cancelled' ? 'bg-slate-100 text-slate-500' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>{f.agent_name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {f.status === 'Pending' && (
                          <button
                            onClick={() => handleMarkComplete(f)}
                            title="Mark Completed"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openViewModal(f)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(f)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(f)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {selectedFollowUp ? 'Edit Follow-up Task' : 'Schedule Follow-up Task'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFollowUp} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Call for Flight Confirmation / Passport Pickup"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 98765 12345"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Staff or Agent</label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Unassigned</option>
                  {staffList.length > 0 && (
                    <optgroup label="Staff Members">
                      {staffList.map(s => (
                        <option key={`stf-modal-${s.id}`} value={s.id}>
                          {s.full_name || s.name} ({s.staff_code || 'Staff'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {agents.length > 0 && (
                    <optgroup label="External Agents">
                      {agents.map(a => (
                        <option key={`agt-modal-${a.id}`} value={a.id}>
                          {a.full_name} ({a.agent_id})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional follow-up context or customer remarks..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs"
                >
                  {loading ? 'Saving...' : 'Save Follow-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewOpen && selectedFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Follow-up Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div><span className="font-bold text-sm text-slate-900">{selectedFollowUp.title}</span></div>
              <div><span className="font-semibold text-slate-700">Customer:</span> {selectedFollowUp.customer_name} ({selectedFollowUp.mobile_number})</div>
              <div><span className="font-semibold text-slate-700">Scheduled:</span> {new Date(selectedFollowUp.scheduled_at).toLocaleString()}</div>
              <div><span className="font-semibold text-slate-700">Status:</span> {selectedFollowUp.status}</div>
              <div><span className="font-semibold text-slate-700">Agent:</span> {selectedFollowUp.agent_name} ({selectedFollowUp.agent_code})</div>
              <div><span className="font-semibold text-slate-700">Notes:</span> {selectedFollowUp.notes || 'None'}</div>

              <div className="pt-3 text-right">
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Follow-up Task"
        itemName={selectedFollowUp?.title || 'Follow-up'}
        userRole={userRole}
        errorMessage={deleteError}
      />
    </div>
  );
}
