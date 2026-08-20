import React, { useState } from 'react';
import { StaffUser, UserRole } from '../types';
import { Shield, UserPlus, ToggleLeft, ToggleRight, Key, Mail, Phone, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StaffManagementModalProps {
  staffList: StaffUser[];
  currentUser: StaffUser;
  onCreateStaff: (data: Partial<StaffUser> & { password: string }) => Promise<void>;
  onUpdateStaff: (id: string, data: Partial<StaffUser> & { resetPassword?: string }) => Promise<void>;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  staffList,
  currentUser,
  onCreateStaff,
  onUpdateStaff
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [password, setPassword] = useState('');

  const [resetStaffId, setResetStaffId] = useState<string | null>(null);
  const [resetPassText, setResetPassText] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name.trim() || !username.trim() || !password.trim()) {
      setError('Name, Username, and Initial Password are required');
      return;
    }

    setLoading(true);
    try {
      await onCreateStaff({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        password: password.trim()
      });
      setSuccess(`Staff account "${username}" created successfully.`);
      setName('');
      setUsername('');
      setEmail('');
      setPhone('');
      setRole('Staff');
      setPassword('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    setError('');
    setSuccess('');
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await onUpdateStaff(staff.id, { status: newStatus });
      setSuccess(`Updated ${staff.name} status to ${newStatus}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update staff status');
    }
  };

  const handleResetPassword = async (staffId: string) => {
    if (!resetPassText || resetPassText.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await onUpdateStaff(staffId, { resetPassword: resetPassText });
      setSuccess('Staff password reset successfully. Staff must change it on login.');
      setResetStaffId(null);
      setResetPassText('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Staff Directory & Access Control
          </h3>
          <p className="text-xs text-slate-500">
            Manage travel agency team members, active status toggles, and login credentials.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel Form' : 'Add New Staff Member'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Add New Staff Form Card */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            Register New Staff Member
          </h4>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. rahul"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@haashiyatravels.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Staff">Staff (Assigned Work View)</option>
                  <option value="Admin">Admin (Full Control Access)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Initial login password"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                New staff will be prompted to change their password on first login.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Staff Member</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Role</th>
                <th className="p-4">Active Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {staffList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  
                  {/* Name & Username */}
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{s.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">@{s.username}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="p-4 space-y-0.5 text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" /> {s.email || 'N/A'}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3 h-3 text-slate-400" /> {s.phone || 'N/A'}
                    </p>
                  </td>

                  {/* Role */}
                  <td className="p-4">
                    {s.role === 'Admin' ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase border border-emerald-200">
                        Admin
                      </span>
                    ) : (
                      <span className="bg-sky-100 text-sky-800 font-bold px-2.5 py-1 rounded-full text-[10px] uppercase border border-sky-200">
                        Staff
                      </span>
                    )}
                  </td>

                  {/* Active Toggle */}
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(s)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                        s.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {s.status === 'active' ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" /> Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-rose-500" /> Inactive
                        </>
                      )}
                    </button>
                  </td>

                  {/* Reset Password Action */}
                  <td className="p-4 text-right">
                    {resetStaffId === s.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="password"
                          value={resetPassText}
                          onChange={(e) => setResetPassText(e.target.value)}
                          placeholder="New password"
                          className="px-2 py-1 text-xs border rounded-lg w-28 focus:ring-1 focus:ring-blue-600"
                        />
                        <button
                          onClick={() => handleResetPassword(s.id)}
                          className="px-2 py-1 bg-blue-800 text-white rounded-lg text-[11px]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setResetStaffId(null)}
                          className="text-slate-400 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResetStaffId(s.id)}
                        className="text-slate-500 hover:text-blue-700 text-xs font-medium flex items-center justify-end gap-1 ml-auto"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Reset Password</span>
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
