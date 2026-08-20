import React, { useState } from 'react';
import { Plane, Lock, User, AlertCircle, Shield, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  onLogin: (username: string, pass: string) => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(username.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-slate-950">
      
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-8 text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-2">
            <div className="w-14 h-14 bg-blue-600/80 border border-blue-400/30 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform -rotate-6">
              <Plane className="w-8 h-8 text-blue-100" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight font-serif">
              Haashiya Air Travels
            </h1>
            <p className="text-xs text-blue-200 font-medium tracking-wide">
              Travel Agency CRM & Work Management System
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter staff username"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Workspace
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login - Removed Raman, just Admin now */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-wider text-center">
              Quick Test Accounts
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillQuickLogin('admin', 'admin123')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition text-left space-y-0.5"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Admin
                </div>
                <div className="text-[10px] text-slate-500">Full Access</div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
          Haashiya Air Travels • Internal Travel CRM System
        </div>

      </div>
    </div>
  );
};
