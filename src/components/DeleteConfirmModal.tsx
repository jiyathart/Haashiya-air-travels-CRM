import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Lock } from 'lucide-react';
import { UserRole } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title?: string;
  itemName?: string;
  userRole?: UserRole;
  isAgentDelete?: boolean;
  errorMessage?: string | null;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Record',
  itemName = 'this item',
  userRole = 'Staff',
  errorMessage = null
}: DeleteConfirmModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdmin = userRole.toLowerCase() === 'admin';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setInternalError(null);
    if (!isAdmin) {
      setInternalError('Only Admin users are authorized to delete records.');
      return;
    }

    try {
      setLoading(true);
      await onConfirm(reason || 'User requested deletion');
      setReason('');
      onClose();
    } catch (err: any) {
      setInternalError(err?.message || 'Failed to delete record.');
    } finally {
      setLoading(false);
    }
  };

  const activeError = internalError || errorMessage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50 border-b border-rose-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-rose-700 font-medium">Permanent or Soft Deletion Workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-rose-100/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {!isAdmin ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start space-x-3">
              <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Access Restricted</p>
                <p className="text-xs mt-1">
                  Only Admin users have permission to delete records. Please contact an administrator to perform this action.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Are you sure you want to delete <span className="font-bold text-slate-900">{itemName}</span>?
                </p>
                <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                  This action will place the record in soft-delete archive with audit timestamp. Admin users can review and restore this record from the <span className="font-semibold text-slate-700">Deleted Records</span> tab.
                </p>
              </div>

              {activeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs font-medium space-y-1">
                  <p className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Action Blocked
                  </p>
                  <p>{activeError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Deletion <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Duplicate entry / Cancelled by customer"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>
            </>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            {isAdmin && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                {loading ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
