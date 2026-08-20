import React, { useState } from 'react';
import { StaffUser, UserRole } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  X,
  Mail,
  Phone,
  Filter,
  Shield,
  Briefcase,
  Building,
  Calendar,
  MapPin,
  AlertCircle,
  User,
  Power
} from 'lucide-react';

interface StaffManagementProps {
  staffList: StaffUser[];
  currentUser: StaffUser;
  userRole: UserRole;
  onRefresh: () => void;
}

export function AgentManagement({ staffList = [], currentUser, userRole, onRefresh }: StaffManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form Fields for Add / Edit
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  const openAddModal = () => {
    setSelectedStaff(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setDesignation('');
    setDepartment('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setAddress('');
    setEmergencyName('');
    setEmergencyPhone('');
    setNotes('');
    setRole('staff');
    setStatus('active');
    setProfilePhotoUrl('');
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const openEditModal = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setFullName(staff.full_name || staff.name || '');
    setEmail(staff.email || '');
    setPassword(''); // Leave empty unless resetting
    setPhone(staff.phone || '');
    setDesignation(staff.designation || '');
    setDepartment(staff.department || '');
    setJoiningDate(staff.joining_date || '');
    setAddress(staff.address || '');
    setEmergencyName(staff.emergency_contact_name || '');
    setEmergencyPhone(staff.emergency_contact_phone || '');
    setNotes(staff.notes || '');
    setRole(staff.role === 'admin' ? 'admin' : 'staff');
    setStatus(staff.status || 'active');
    setProfilePhotoUrl(staff.profile_photo_url || '');
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const openViewModal = (staff: StaffUser) => {
    setSelectedStaff(staff);
    setIsViewOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!fullName.trim() || !email.trim()) {
      setFormError('Full Name and Email Address are required.');
      return;
    }

    if (!selectedStaff && !password.trim()) {
      setFormError('A temporary password is required for creating a new staff account.');
      return;
    }

    try {
      setLoading(true);
      if (selectedStaff) {
        // Edit existing staff
        await supabaseService.updateStaff(selectedStaff.id, {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          designation: designation.trim(),
          department: department.trim(),
          joining_date: joiningDate,
          address: address.trim(),
          emergency_contact_name: emergencyName.trim(),
          emergency_contact_phone: emergencyPhone.trim(),
          notes: notes.trim(),
          role,
          status,
          active: status === 'active',
          profile_photo_url: profilePhotoUrl.trim()
        });
        setFormSuccess('Staff profile updated successfully.');
        setTimeout(() => {
          setIsFormOpen(false);
          onRefresh();
        }, 1000);
      } else {
        // Create new staff via server API endpoint
        const res = await supabaseService.createStaff({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          phone: phone.trim(),
          designation: designation.trim(),
          department: department.trim(),
          joiningDate,
          address: address.trim(),
          emergencyContactName: emergencyName.trim(),
          emergencyContactPhone: emergencyPhone.trim(),
          notes: notes.trim(),
          role,
          status,
          profilePhotoUrl: profilePhotoUrl.trim()
        });

        if (res.success) {
          setFormSuccess('Staff account created successfully.');
          setTimeout(() => {
            setIsFormOpen(false);
            onRefresh();
          }, 1200);
        }
      }
    } catch (err: any) {
      setFormError(err?.message || 'An error occurred while saving staff details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    try {
      setLoading(true);
      const newStatus = staff.status === 'active' ? 'inactive' : 'active';
      await supabaseService.updateStaff(staff.id, {
        status: newStatus,
        active: newStatus === 'active'
      });
      onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Failed to update staff status.');
    } finally {
      setLoading(false);
    }
  };

  // Search & Filter
  const filteredStaff = staffList.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (s.full_name || s.name || '').toLowerCase().includes(term) ||
      (s.staff_code || '').toLowerCase().includes(term) ||
      (s.email || '').toLowerCase().includes(term) ||
      (s.phone || '').includes(term) ||
      (s.designation || '').toLowerCase().includes(term) ||
      (s.department || '').toLowerCase().includes(term);

    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-sky-600" />
            <h2 className="text-xl font-bold text-slate-900">Staff Management Directory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage all staff profiles, job roles, access permissions, and account statuses.
          </p>
        </div>

        {(userRole === 'Admin' || userRole === 'admin' || currentUser.role === 'admin') && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Staff</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Staff Code (e.g. HAT-0001), Name, Email, Phone, Designation..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Staff List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {staffList.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No staff members added yet.</h3>
            <p className="text-xs text-slate-500">Click Add Staff to create the first staff account.</p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Staff Code</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role & Dept</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Active Tasks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No staff members found matching your search query.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200/60 font-mono">
                          {staff.staff_code || 'HAT-0000'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {staff.profile_photo_url ? (
                            <img
                              src={staff.profile_photo_url}
                              alt={staff.full_name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                              {(staff.full_name || staff.name || 'S').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 text-xs">
                              {staff.full_name || staff.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {staff.designation || 'Staff Member'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 space-y-0.5">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          staff.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {staff.role}
                        </span>
                        {staff.department && (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{staff.department}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{staff.email}</span>
                        </div>
                        {staff.phone && (
                          <div className="flex items-center space-x-1.5 text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{staff.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-700">
                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                          {staff.assignedTaskCount || 0} active
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          staff.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {staff.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          )}
                          <span className="capitalize">{staff.status}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => openViewModal(staff)}
                            title="View Full Profile"
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(userRole === 'Admin' || userRole === 'admin' || currentUser.role === 'admin') && (
                            <>
                              <button
                                onClick={() => openEditModal(staff)}
                                title="Edit Staff Member"
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleToggleStatus(staff)}
                                title={staff.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                                className={`p-1.5 rounded-lg transition ${
                                  staff.status === 'active'
                                    ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT STAFF MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {selectedStaff ? `Edit Staff Member (${selectedStaff.staff_code})` : 'Add New Staff Account'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Personal Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
                  Personal & Login Credentials
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Mohammed Jiyath"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled={!!selectedStaff} // Cannot edit email for existing auth user
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@haashiyaairtravels.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {!selectedStaff && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter initial password (e.g. StaffPass@123)"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">The employee will use this password to sign in initially.</p>
                  </div>
                )}
              </div>

              {/* Job & Contact Details */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
                  Job & Contact Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Title</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Senior Travel Executive"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Ticketing / Visas"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter employee residential address"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Emergency Contact & Photo */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
                  Emergency Contact & Avatar
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Person</label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="Name of relative / spouse"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone Number</label>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo Image URL (Optional)</label>
                  <input
                    type="url"
                    value={profilePhotoUrl}
                    onChange={(e) => setProfilePhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special skills, internal remarks, or qualifications..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : selectedStaff ? 'Update Staff Profile' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW STAFF DETAILS MODAL */}
      {isViewOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Staff Profile Details</h3>
              <button onClick={() => setIsViewOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
                {selectedStaff.profile_photo_url ? (
                  <img
                    src={selectedStaff.profile_photo_url}
                    alt={selectedStaff.full_name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-base border border-blue-200">
                    {(selectedStaff.full_name || selectedStaff.name || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{selectedStaff.full_name || selectedStaff.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sky-800 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                      {selectedStaff.staff_code || 'HAT-0000'}
                    </span>
                    <span className={`capitalize font-bold text-[10px] px-2 py-0.5 rounded-full ${
                      selectedStaff.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedStaff.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="font-semibold text-slate-500 block text-[10px]">Email Address</span>
                  <span className="font-medium text-slate-900">{selectedStaff.email}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-[10px]">Phone Number</span>
                  <span className="font-medium text-slate-900">{selectedStaff.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-[10px]">Designation</span>
                  <span className="font-medium text-slate-900">{selectedStaff.designation || 'Staff'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-[10px]">Department</span>
                  <span className="font-medium text-slate-900">{selectedStaff.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-[10px]">Joining Date</span>
                  <span className="font-medium text-slate-900">{selectedStaff.joining_date || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block text-[10px]">Account Status</span>
                  <span className={`capitalize font-bold ${selectedStaff.status === 'active' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedStaff.status}
                  </span>
                </div>
              </div>

              {selectedStaff.address && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-500 block text-[10px]">Address</span>
                  <span className="text-slate-800">{selectedStaff.address}</span>
                </div>
              )}

              {(selectedStaff.emergency_contact_name || selectedStaff.emergency_contact_phone) && (
                <div className="pt-2 border-t border-slate-100 bg-slate-50 p-3 rounded-lg">
                  <span className="font-bold text-slate-700 block text-[11px] mb-1">Emergency Contact</span>
                  <div className="text-slate-600 space-y-0.5">
                    <div>{selectedStaff.emergency_contact_name}</div>
                    <div className="font-mono text-slate-800">{selectedStaff.emergency_contact_phone}</div>
                  </div>
                </div>
              )}

              {selectedStaff.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-500 block text-[10px]">Notes</span>
                  <p className="text-slate-700 italic">{selectedStaff.notes}</p>
                </div>
              )}

              <div className="pt-4 text-right border-t border-slate-100">
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
