import React, { useState, useEffect } from 'react';
import { DeletedRecord, UserRole } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { 
  Trash2, 
  RotateCcw, 
  AlertOctagon, 
  Search, 
  ShieldAlert, 
  Calendar, 
  UserCheck, 
  FileText, 
  RefreshCw,
  Lock,
  X
} from 'lucide-react';

interface DeletedRecordsPageProps {
  userRole: UserRole;
  onRefreshParent: () => void;
}

export function DeletedRecordsPage({ userRole, onRefreshParent }: DeletedRecordsPageProps) {
  const [records, setRecords] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isAdmin = userRole.toLowerCase() === 'admin';

  const fetchDeleted = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getDeletedRecords();
      setRecords(data);
    } catch (err: any) {
      console.error('Failed to load deleted records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDeleted();
    }
  }, [isAdmin]);

  const handleRestore = async (rec: DeletedRecord) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await supabaseService.restoreRecord(rec.table_name, rec.id);
      setActionSuccess(`Restored "${rec.record_title}" successfully.`);
      await fetchDeleted();
      onRefreshParent();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to restore record.');
    }
  };

  const handlePermanentDelete = async (rec: DeletedRecord) => {
    if (!window.confirm(`PERMANENT DELETION WARNING: Are you sure you want to permanently delete "${rec.record_title}" from ${rec.table_name}? This action CANNOT be undone.`)) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      await supabaseService.permanentDeleteRecord(rec.table_name, rec.id);
      setActionSuccess(`Permanently deleted "${rec.record_title}".`);
      await fetchDeleted();
      onRefreshParent();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to permanently delete record.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start space-x-3">
        <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-bold">Admin Privileges Required</h3>
          <p className="text-xs text-amber-800 mt-1">
            The Deleted Records Audit Archive is strictly reserved for Admin users. Please contact an administrator if you need to restore or audit a deleted record.
          </p>
        </div>
      </div>
    );
  }

  const filtered = records.filter(r => {
    const matchesSearch =
      r.record_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.record_subtitle && r.record_subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.delete_reason && r.delete_reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTable = tableFilter === 'all' || r.table_name === tableFilter;

    return matchesSearch && matchesTable;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Trash2 className="w-6 h-6 text-rose-600" />
            <h2 className="text-xl font-bold text-slate-900">Deleted Records (Trash & Audit)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Admin-only management for reviewing soft-deleted CRM records, soft delete reasons, restoration, and permanent removal.
          </p>
        </div>

        <button
          onClick={fetchDeleted}
          className="inline-flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Archive</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search deleted items, titles, or delete reasons..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Record Type:</span>
          <select
            value={tableFilter}
            onChange={(e) => setTableFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase font-semibold"
          >
            <option value="all">All Tables</option>
            <option value="agents">Agents</option>
            <option value="customers">Customers</option>
            <option value="enquiries">Enquiries</option>
            <option value="bookings">Bookings</option>
            <option value="payments">Payments</option>
            <option value="expenses">Expenses</option>
            <option value="follow_ups">Follow-ups</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Record & Type</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4">Deletion Reason</th>
                <th className="py-3 px-4">Deleted At</th>
                <th className="py-3 px-4 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    Loading deleted records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    No soft-deleted records found.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={`${rec.table_name}-${rec.id}`} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rec.record_title}</div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {rec.table_name}
                        </span>
                        {rec.record_subtitle && (
                          <span className="text-[11px] text-slate-500 truncate max-w-xs">{rec.record_subtitle}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>{rec.assigned_agent_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="italic text-slate-600 bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100">
                        {rec.delete_reason || 'No reason specified'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(rec.deleted_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => handleRestore(rec)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(rec)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge</span>
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
    </div>
  );
}
