import React, { useState } from 'react';
import { Enquiry, Agent, UserRole } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { exportToCSV } from '../utils/csvExport';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  Phone, 
  Calendar, 
  UserCheck, 
  X,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  Download
} from 'lucide-react';

interface EnquiryManagementProps {
  enquiries: Enquiry[];
  agents: Agent[];
  userRole: UserRole;
  onRefresh: () => void;
}

export function EnquiryManagement({ enquiries, agents, userRole, onRefresh }: EnquiryManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [serviceType, setServiceType] = useState('Flight Booking');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'New' | 'In Progress' | 'Followed Up' | 'Converted' | 'Closed'>('New');
  const [expectedDate, setExpectedDate] = useState('');
  const [agentId, setAgentId] = useState('');

  const openAddModal = () => {
    setSelectedEnquiry(null);
    setCustomerName('');
    setMobileNumber('');
    setServiceType('Flight Booking');
    setDescription('');
    setStatus('New');
    setExpectedDate('');
    setAgentId(agents[0]?.id || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setCustomerName(enquiry.customer_name);
    setMobileNumber(enquiry.mobile_number);
    setServiceType(enquiry.service_type);
    setDescription(enquiry.description || '');
    setStatus(enquiry.status);
    setExpectedDate(enquiry.expected_date || '');
    setAgentId(enquiry.agent_id || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openViewModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsViewOpen(true);
  };

  const openDeleteModal = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleSaveEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim() || !mobileNumber.trim()) {
      setFormError('Customer Name and Mobile Number are required.');
      return;
    }

    try {
      setLoading(true);
      if (selectedEnquiry) {
        await supabaseService.updateEnquiry(selectedEnquiry.id, {
          customer_name: customerName,
          mobile_number: mobileNumber,
          service_type: serviceType,
          description,
          status,
          expected_date: expectedDate || null,
          agent_id: agentId || null
        });
      } else {
        await supabaseService.createEnquiry({
          customer_name: customerName,
          mobile_number: mobileNumber,
          service_type: serviceType,
          description,
          status,
          expected_date: expectedDate || null,
          agent_id: agentId || null
        });
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save enquiry.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!selectedEnquiry) return;
    try {
      await supabaseService.deleteEnquiry(selectedEnquiry.id, reason, 'admin');
      setIsDeleteOpen(false);
      onRefresh();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete enquiry.');
      throw err;
    }
  };

  const filteredEnquiries = enquiries.filter(e => {
    const matchesSearch =
      e.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.mobile_number.includes(searchTerm) ||
      e.service_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesAgent = agentFilter === 'all' || e.agent_id === agentFilter;

    return matchesSearch && matchesStatus && matchesAgent;
  });

  const handleExportEnquiriesCSV = () => {
    const headers = [
      'Enquiry ID',
      'Customer Name',
      'Mobile Number',
      'Service Requested',
      'Description / Requirement',
      'Status',
      'Expected Travel/Service Date',
      'Assigned Agent',
      'Created At'
    ];

    const agentMap = new Map(agents.map(a => [a.id, a.full_name]));

    const rows = filteredEnquiries.map(e => [
      e.id,
      e.customer_name,
      e.mobile_number,
      e.service_type,
      e.description || '',
      e.status,
      e.expected_date || '',
      e.agent_id ? (agentMap.get(e.agent_id) || 'Assigned') : 'Unassigned',
      e.created_at || ''
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    exportToCSV(`Haashiya_Enquiries_Report_${dateStr}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Enquiries & Leads</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track customer travel enquiries, conversion status, and assigned sales agents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportEnquiriesCSV}
            className="inline-flex items-center justify-center space-x-2 px-3.5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition"
            title="Download enquiries list as CSV file"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV ({filteredEnquiries.length})</span>
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Enquiry</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Customer Name, Mobile Number, Service..."
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
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Followed Up">Followed Up</option>
            <option value="Converted">Converted</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Agents</option>
            {agents.map(a => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.agent_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Requested Service</th>
                <th className="py-3 px-4">Expected Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    No enquiries found matching filter.
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{e.customer_name}</div>
                      <div className="flex items-center space-x-1 text-slate-500 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{e.mobile_number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {e.service_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {e.expected_date ? (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{e.expected_date}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">TBD</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        e.status === 'Converted' ? 'bg-emerald-100 text-emerald-800' :
                        e.status === 'In Progress' ? 'bg-sky-100 text-sky-800' :
                        e.status === 'Followed Up' ? 'bg-purple-100 text-purple-800' :
                        e.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 text-slate-700">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>{e.agent_name || 'Unassigned'}</span>
                        {e.agent_code && (
                          <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-1.5 py-0.5 rounded border border-sky-200">
                            {e.agent_code}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openViewModal(e)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(e)}
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
                {selectedEnquiry ? 'Edit Enquiry' : 'Add New Enquiry'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEnquiry} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Hassan Ahmed"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type</label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. Flight Booking, Visa Application, Passport Fresh..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Followed Up">Followed Up</option>
                    <option value="Converted">Converted</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Agent</label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Unassigned</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.full_name} ({a.agent_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about travel dates, budget, flight preferences..."
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
                  {loading ? 'Saving...' : 'Save Enquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {isViewOpen && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Enquiry Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div><span className="font-bold text-sm text-slate-900">{selectedEnquiry.customer_name}</span></div>
              <div><span className="font-semibold text-slate-700">Mobile:</span> {selectedEnquiry.mobile_number}</div>
              <div><span className="font-semibold text-slate-700">Service:</span> {selectedEnquiry.service_type}</div>
              <div><span className="font-semibold text-slate-700">Status:</span> {selectedEnquiry.status}</div>
              <div><span className="font-semibold text-slate-700">Expected Date:</span> {selectedEnquiry.expected_date || 'N/A'}</div>
              <div><span className="font-semibold text-slate-700">Assigned Agent:</span> {selectedEnquiry.agent_name} ({selectedEnquiry.agent_code})</div>
              <div><span className="font-semibold text-slate-700">Notes:</span> {selectedEnquiry.description || 'None'}</div>

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
        title="Delete Enquiry"
        itemName={`Enquiry for ${selectedEnquiry?.customer_name || ''}`}
        userRole={userRole}
        errorMessage={deleteError}
      />
    </div>
  );
}
