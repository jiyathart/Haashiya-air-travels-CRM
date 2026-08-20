import React, { useState } from 'react';
import { StaffUser } from '../types';
import { supabaseService } from '../lib/supabaseService';
import { Plane, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AdminProfileViewProps {
  currentUser: StaffUser;
  onRefresh: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({ currentUser, onRefresh }) => {
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileAddress, setProfileAddress] = useState(currentUser.address || '');
  const [profileEmergencyName, setProfileEmergencyName] = useState(currentUser.emergency_contact_name || '');
  const [profileEmergencyPhone, setProfileEmergencyPhone] = useState(currentUser.emergency_contact_phone || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(currentUser.profile_photo_url || '');
  
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      await supabaseService.updateStaff(currentUser.id, {
        phone: profilePhone,
        address: profileAddress,
        emergency_contact_name: profileEmergencyName,
        emergency_contact_phone: profileEmergencyPhone,
        profile_photo_url: profilePhotoUrl,
      });

      setProfileSuccess('Profile details updated successfully!');
      onRefresh();
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
          {profilePhotoUrl ? (
            <img
              src={profilePhotoUrl}
              alt={currentUser.full_name || currentUser.name}
              className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xl border border-indigo-200 shadow-xs">
              {(currentUser.full_name || currentUser.name || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-900">{currentUser.full_name || currentUser.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-bold bg-sky-50 text-sky-800 px-2.5 py-0.5 rounded border border-sky-200">
                {currentUser.staff_code || 'HAT-0000'}
              </span>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full capitalize">
                {currentUser.role} Account
              </span>
            </div>
          </div>
        </div>

        {/* Readonly Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100">
          <div>
            <span className="font-semibold text-slate-400 block">Email Address (Read-Only)</span>
            <span className="font-bold text-slate-800">{currentUser.email}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block">Designation</span>
            <span className="font-bold text-slate-800">{currentUser.designation || 'Staff Member'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block">Department</span>
            <span className="font-bold text-slate-800">{currentUser.department || 'Operations'}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block">Joining Date</span>
            <span className="font-bold text-slate-800">{currentUser.joining_date || 'N/A'}</span>
          </div>
        </div>

        {/* Editable Profile Form */}
        <form onSubmit={handleUpdateProfile} className="pt-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Edit Contact Details</h3>
          
          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}
          
          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Profile Photo Image URL (Optional)</label>
              <input
                type="text"
                value={profilePhotoUrl}
                onChange={(e) => setProfilePhotoUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Home Address</label>
              <textarea
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Full residential address..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={profileEmergencyName}
                onChange={(e) => setProfileEmergencyName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="text"
                value={profileEmergencyPhone}
                onChange={(e) => setProfileEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
            >
              {profileSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
