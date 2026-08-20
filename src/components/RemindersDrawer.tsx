import React, { useState } from 'react';
import { ReminderItem, ReminderCategory, StaffUser } from '../types';
import { Bell, CheckCircle, Clock, AlertCircle, X, ChevronRight, User, Ticket, FileText, Check, ShieldAlert, Briefcase } from 'lucide-react';

interface RemindersDrawerProps {
  isOpen: boolean;
  reminders: ReminderItem[];
  currentUser: StaffUser;
  onClose: () => void;
  onAcknowledge: (reminderId: string) => Promise<void>;
  onSelectBooking: (type: 'ticket' | 'passport' | 'general', id: string) => void;
}

export const RemindersDrawer: React.FC<RemindersDrawerProps> = ({
  isOpen,
  reminders,
  currentUser,
  onClose,
  onAcknowledge,
  onSelectBooking
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | 'All'>('All');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter reminders for staff vs admin
  const userReminders = currentUser.role === 'Admin'
    ? reminders
    : reminders.filter(r => r.assignedStaffId === currentUser.id);

  // Filter out acknowledged ones for unread count
  const activeUnreadReminders = userReminders.filter(r => !r.isAcknowledged);

  const filteredReminders = userReminders.filter(r => {
    if (selectedCategory === 'All') return true;
    return r.category === selectedCategory;
  });

  const handleAck = async (e: React.MouseEvent, remId: string) => {
    e.stopPropagation();
    setLoadingId(remId);
    try {
      await onAcknowledge(remId);
    } catch (err) {
      console.error('Failed to acknowledge reminder', err);
    } finally {
      setLoadingId(null);
    }
  };

  const getCategoryColor = (cat: ReminderCategory) => {
    switch (cat) {
      case 'Overdue': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Today': return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Tomorrow': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Upcoming': return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'Stalled': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-250">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-xl">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Work Alerts & Reminders
                <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {activeUnreadReminders.length}
                </span>
              </h3>
              <p className="text-xs text-blue-200">
                {currentUser.role === 'Admin' ? 'All System Alerts' : 'Your Assigned Work Reminders'}
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

        {/* Category Filters Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
          {(['All', 'Today', 'Tomorrow', 'Upcoming', 'Overdue', 'Stalled'] as const).map(cat => {
            const count = userReminders.filter(r => cat === 'All' ? !r.isAcknowledged : r.category === cat && !r.isAcknowledged).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-blue-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 rounded-full ${
                    selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reminders List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
          {filteredReminders.length > 0 ? (
            filteredReminders.map(rem => (
              <div
                key={rem.id}
                onClick={() => {
                  onSelectBooking(rem.bookingType, rem.bookingId);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition shadow-xs cursor-pointer group hover:border-blue-400 ${
                  rem.isAcknowledged
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : rem.severity === 'high'
                    ? 'bg-amber-50/60 border-amber-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {rem.bookingType === 'ticket' ? (
                      <span className="p-1 bg-blue-100 text-blue-700 rounded-md">
                        <Ticket className="w-3.5 h-3.5" />
                      </span>
                    ) : rem.bookingType === 'passport' ? (
                      <span className="p-1 bg-indigo-100 text-indigo-700 rounded-md">
                        <FileText className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 bg-amber-100 text-amber-900 rounded-md">
                        <Briefcase className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {rem.title}
                    </span>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getCategoryColor(rem.category)}`}>
                    {rem.category}
                  </span>
                </div>

                <p className="text-slate-600 font-medium text-[11px]">
                  {rem.subtitle}
                </p>

                <p className="text-slate-500 mt-1 bg-white/80 p-2 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                  {rem.alertReason}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span className="font-medium text-slate-700">{rem.assignedStaffName}</span>
                  </span>

                  <div className="flex items-center space-x-2">
                    {!rem.isAcknowledged ? (
                      <button
                        onClick={(e) => handleAck(e, rem.id)}
                        disabled={loadingId === rem.id}
                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-lg transition flex items-center gap-1 text-[10px]"
                      >
                        <Check className="w-3 h-3" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Done
                      </span>
                    )}

                    <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition flex items-center text-[11px]">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 opacity-80" />
              <p className="text-sm font-semibold text-slate-600">No active alerts in this category</p>
              <p className="text-xs text-slate-400">All bookings are on track and up to date.</p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 shrink-0">
          Acknowledging an alert clears it from your task bar without altering the booking status.
        </div>

      </div>
    </div>
  );
};
