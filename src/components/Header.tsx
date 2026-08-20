import React from 'react';
import { StaffUser } from '../types';
import { Plane, Globe, Bell, Lock, LogOut, Shield, Sparkles, CreditCard, Sun, Briefcase, UserCheck, Users, HelpCircle, Receipt, Clock, Trash2, Database } from 'lucide-react';

export type ActiveTabType = 
  | 'dashboard' 
  | 'tickets' 
  | 'passports' 
  | 'general' 
  | 'agents' 
  | 'customers' 
  | 'enquiries' 
  | 'expenses' 
  | 'follow_ups' 
  | 'deleted' 
  | 'setup' 
  | 'reminders' 
  | 'staff' 
  | 'payments';

interface HeaderProps {
  currentUser: StaffUser;
  unreadRemindersCount: number;
  onOpenReminders: () => void;
  onOpenDailyBriefing: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onOpenAuthCard?: () => void;
  onResetDemo?: () => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  unreadRemindersCount,
  onOpenReminders,
  onOpenDailyBriefing,
  onChangePassword,
  onLogout,
  onOpenAuthCard,
  onResetDemo,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-lg border-b border-blue-700/50 sticky top-0 z-40">
      {/* Top Banner Branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-blue-600/80 border border-blue-400/30 flex items-center justify-center shadow-inner">
            <Plane className="w-6 h-6 text-blue-200 transform -rotate-12" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-serif">
                Haashiya Air Travels
              </h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/30 border border-blue-400/30 px-2 py-0.5 rounded-full text-blue-200">
                CRM v1.0
              </span>
            </div>
            <p className="text-xs text-blue-200/80 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-blue-300" /> Passport, Ticket & e-Sevai Management
            </p>
          </div>
        </div>

        {/* User Info & Actions Bar */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          
          {/* Daily Briefing Button */}
          <button
            onClick={onOpenDailyBriefing}
            className="p-2 rounded-lg bg-emerald-700/60 hover:bg-emerald-600/80 border border-emerald-500/50 text-emerald-100 transition-all flex items-center gap-1.5 shadow-xs"
            title="Open Morning Daily Briefing"
          >
            <Sun className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-semibold hidden sm:inline">Daily Briefing</span>
          </button>

          {/* Reminders Alert Bell */}
          <button
            onClick={onOpenReminders}
            className={`relative p-2 rounded-lg border transition-all flex items-center gap-1.5 ${
              unreadRemindersCount > 0
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200 hover:bg-amber-500/30'
                : 'bg-blue-800/60 border-blue-700/60 text-blue-200 hover:bg-blue-700/60'
            }`}
            title="View Reminders & Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Alerts</span>
            {unreadRemindersCount > 0 && (
              <span className="ml-1 bg-amber-500 text-slate-950 font-bold text-xs px-1.5 py-0.2 rounded-full animate-pulse">
                {unreadRemindersCount}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-700/50 px-3 py-1.5 rounded-lg text-xs">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-white flex items-center gap-1">
                {currentUser.name}
                {currentUser.role === 'Admin' ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0.2 rounded uppercase font-bold">
                    Admin
                  </span>
                ) : (
                  <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[9px] px-1.5 py-0.2 rounded uppercase font-bold">
                    Staff
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sign In / Auth Button */}
          {onOpenAuthCard && (
            <button
              onClick={onOpenAuthCard}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg text-xs shadow transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sign In / Auth</span>
            </button>
          )}

          {/* User Action Buttons */}
          <button
            onClick={onChangePassword}
            className="p-2 text-blue-200 hover:text-white bg-blue-800/40 hover:bg-blue-700/50 rounded-lg border border-blue-700/50 transition"
            title="Change Password"
          >
            <Lock className="w-4 h-4" />
          </button>

          {currentUser.role === 'Admin' && onResetDemo && (
            <button
              onClick={onResetDemo}
              className="p-2 text-blue-200 hover:text-white bg-blue-800/40 hover:bg-blue-700/50 rounded-lg border border-blue-700/50 transition hidden md:flex items-center gap-1 text-xs"
              title="Reset Demo Data"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-medium border border-rose-500/50 shadow-sm transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-blue-950/80 border-t border-blue-800/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 text-xs font-medium no-scrollbar">
          
          {/* Admin Navigation Tabs */}
          {(currentUser.role === 'Admin' || currentUser.role === 'admin') ? (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                Admin Dashboard
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'staff' || activeTab === 'agents'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-sky-200 hover:bg-sky-800/50 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-300" />
                <span>Staff Management</span>
              </button>

              <button
                onClick={() => setActiveTab('tickets')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'tickets'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                <span>Ticket Bookings</span>
              </button>

              <button
                onClick={() => setActiveTab('passports')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'passports'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                <span>Passport Processes</span>
              </button>

              <button
                onClick={() => setActiveTab('general')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'general'
                    ? 'bg-amber-600 text-white font-semibold shadow'
                    : 'text-amber-200 hover:bg-amber-800/50 hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                <span>e-Sevai & Services</span>
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'customers'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-sky-200 hover:bg-sky-800/50 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-300" />
                <span>Customers</span>
              </button>

              <button
                onClick={() => setActiveTab('enquiries')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'enquiries'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-sky-200 hover:bg-sky-800/50 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-sky-300" />
                <span>Enquiries</span>
              </button>

              <button
                onClick={() => setActiveTab('expenses')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'expenses'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-sky-200 hover:bg-sky-800/50 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-rose-300" />
                <span>Expenses</span>
              </button>

              <button
                onClick={() => setActiveTab('follow_ups')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'follow_ups'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-sky-200 hover:bg-sky-800/50 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>Follow-ups</span>
              </button>

              <button
                onClick={() => setActiveTab('reminders')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'reminders'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                <span>Work Alerts & Reminders</span>
                {unreadRemindersCount > 0 && (
                  <span className="bg-amber-400 text-slate-900 text-[10px] font-bold px-1.5 rounded-full">
                    {unreadRemindersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
                <span>Payments & Collections</span>
              </button>

              <button
                onClick={() => setActiveTab('deleted')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'deleted'
                    ? 'bg-rose-600 text-white font-semibold shadow'
                    : 'text-rose-200 hover:bg-rose-800/50 hover:text-white'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Trash Archive</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-sky-200 hover:bg-sky-800/50 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-300" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setActiveTab('setup')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'setup'
                    ? 'bg-slate-700 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>Supabase Setup</span>
              </button>
            </>
          ) : (
            /* Staff Navigation Tabs */
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                My Assigned Tasks
              </button>

              <button
                onClick={() => setActiveTab('staff')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'staff'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-300" />
                <span>My Profile</span>
              </button>
            </>
          )}

        </div>
      </div>
    </header>
  );
};
