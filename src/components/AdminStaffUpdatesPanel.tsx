import React, { useState, useEffect } from 'react';
import { supabaseService } from '../lib/supabaseService';
import { Clock, UserCheck, Activity, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminStaffUpdatesPanel: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.getActivityLogs();
      setLogs(data);
    } catch (e) {
      console.warn('Failed to load activity logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Staff Updates</h3>
            <p className="text-[11px] text-slate-500">Live task updates & activity logs from staff</p>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition"
          title="Refresh updates"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-4 text-center">Loading recent staff activity…</p>
      ) : logs.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
          No staff task updates recorded yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {logs.map((log) => {
            const timeAgo = new Date(log.created_at).toLocaleString();
            return (
              <div
                key={log.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1 hover:border-slate-200 transition"
              >
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    {log.staff_name || 'Staff User'}
                  </span>
                  <span className="text-[10px] text-slate-400">{timeAgo}</span>
                </div>

                <p className="font-semibold text-slate-900">
                  {log.task_title || 'General Task'}
                </p>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                    {log.old_status || 'Pending'}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {log.new_status}
                  </span>
                </div>

                {log.note && (
                  <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 mt-1">
                    "{log.note}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
