'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Building,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  CreditCard,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Users,
  Network,
  BadgeCheck,
  Clock,
  Sparkles,
  FileText,
  RefreshCw,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'statutory' | 'security'>('overview');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable personal info form
  const [personalForm, setPersonalForm] = useState({
    name: '',
    phone: '',
    currentAddress: '',
    permanentAddress: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
  });

  // Editable statutory & banking details form
  const [statutoryForm, setStatutoryForm] = useState({
    panNumber: '',
    aadhaarNumber: '',
    uanNumber: '',
    esiNumber: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    accountHolderName: '',
  });
  const [statutorySaving, setStatutorySaving] = useState(false);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/profile');
      const data = await res.json();
      if (data.success) {
        setProfileData(data);
        const u = data.user || {};
        const emp = data.employee || {};
        setPersonalForm({
          name: u.name || '',
          phone: emp.phone || u.phone || '',
          currentAddress: emp.currentAddress || '',
          permanentAddress: emp.permanentAddress || '',
          emergencyName: emp.emergencyContact?.name || '',
          emergencyRelation: emp.emergencyContact?.relationship || '',
          emergencyPhone: emp.emergencyContact?.phone || '',
        });

        const b = emp.bankDetails || {};
        setStatutoryForm({
          panNumber: emp.panNumber || '',
          aadhaarNumber: emp.aadhaarNumber || '',
          uanNumber: emp.uanNumber || '',
          esiNumber: emp.esiNumber || '',
          bankName: b.bankName || '',
          accountNumber: b.accountNumber || '',
          ifscCode: b.ifscCode || '',
          branchName: b.branchName || '',
          accountHolderName: b.accountHolderName || u.name || '',
        });
      }
    } catch (e: any) {
      console.error(e);
      showToast('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveStatutory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatutorySaving(true);
    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          panNumber: statutoryForm.panNumber,
          aadhaarNumber: statutoryForm.aadhaarNumber,
          uanNumber: statutoryForm.uanNumber,
          esiNumber: statutoryForm.esiNumber,
          bankDetails: {
            bankName: statutoryForm.bankName,
            accountNumber: statutoryForm.accountNumber,
            ifscCode: statutoryForm.ifscCode,
            branchName: statutoryForm.branchName,
            accountHolderName: statutoryForm.accountHolderName,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Statutory and banking details updated successfully!');
        await fetchProfile();
      } else {
        showToast(data.error || 'Failed to update statutory details', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setStatutorySaving(false);
    }
  };

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: personalForm.name,
          phone: personalForm.phone,
          currentAddress: personalForm.currentAddress,
          permanentAddress: personalForm.permanentAddress,
          emergencyContact: {
            name: personalForm.emergencyName,
            relationship: personalForm.emergencyRelation,
            phone: personalForm.emergencyPhone,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Profile details updated successfully!');
        await fetchProfile();
        await refreshSession();
      } else {
        showToast(data.error || 'Failed to update profile', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New password and confirmation do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch('/api/v1/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.error || 'Failed to change password', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  const emp = profileData?.employee;
  const org = profileData?.organization;
  const role = profileData?.role;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Toast Notification */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 shadow-md transition-all ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* HERO PROFILE HEADER */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-indigo-700 via-indigo-600 to-orange-500 relative">
            <div className="absolute right-6 top-4 flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 tracking-wider">
                {org?.name || 'OneWayHR Cloud'}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-500 to-indigo-600 p-1 shadow-xl flex-shrink-0">
                <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center font-black text-2xl text-slate-800 uppercase shadow-inner">
                  {user?.name?.slice(0, 2) || 'HR'}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    {user?.name || 'Employee Profile'}
                  </h1>
                  {emp?.employeeCode && (
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                      {emp.employeeCode}
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md">
                    {role?.name || user?.role || 'Staff Member'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user?.email}
                  </span>
                  {(emp?.phone || user?.phone) && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {emp?.phone || user?.phone}
                    </span>
                  )}
                  {emp?.departmentId?.name && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {emp.departmentId.name}
                    </span>
                  )}
                  {emp?.branchId?.city && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {emp.branchId.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <a
                href="/self-service"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>My Self-Service</span>
              </a>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-t border-slate-100 px-6 space-x-3 overflow-x-auto text-xs font-bold">
            {[
              { id: 'overview', label: '1. Employment Overview', icon: Briefcase },
              { id: 'personal', label: '2. Personal & Contact Info', icon: User },
              { id: 'statutory', label: '3. Statutory & Bank Details', icon: CreditCard },
              { id: 'security', label: '4. Security & Password', icon: Lock },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-orange-500 text-orange-600 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 font-semibold'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: EMPLOYMENT OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Job Details Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-orange-600" />
                  <span>Official Job Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Designation / Title</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {emp?.designationId?.title || 'Not Assigned'}
                    </p>
                    {emp?.designationId?.grade && (
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                        Grade {emp.designationId.grade}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Department</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {emp?.departmentId?.name || 'Not Assigned'}
                    </p>
                    {emp?.departmentId?.code && (
                      <span className="text-[10px] text-slate-500 font-mono mt-1 inline-block">
                        Dept Code: {emp.departmentId.code}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Office / Branch</span>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">
                      {emp?.branchId?.name || 'Not Assigned'}
                    </p>
                    {emp?.branchId?.city && (
                      <span className="text-[10px] text-slate-500 mt-1 inline-block">
                        {emp.branchId.city}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Employment Status</span>
                    <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {emp?.status || 'ACTIVE'} ({emp?.employmentType || 'FULL_TIME'})
                    </p>
                    {emp?.joiningDate && (
                      <span className="text-[10px] text-slate-500 mt-1 inline-block">
                        Joined: {new Date(emp.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reporting Hierarchy Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-600" />
                  <span>Reporting Governance Hierarchy</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs">
                    <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
                      HR Reporting Manager
                    </span>
                    <div className="font-bold text-slate-900 mt-1">
                      {emp?.reportingManagerId ? `${emp.reportingManagerId.firstName} ${emp.reportingManagerId.lastName}` : 'Not Assigned'}
                    </div>
                    {emp?.reportingManagerId?.email && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{emp.reportingManagerId.email}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs">
                    <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                      Team Lead (TL)
                    </span>
                    <div className="font-bold text-slate-900 mt-1">
                      {emp?.technicalLeadId ? `${emp.technicalLeadId.firstName} ${emp.technicalLeadId.lastName}` : 'Not Assigned'}
                    </div>
                    {emp?.technicalLeadId?.email && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{emp.technicalLeadId.email}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Project Manager (PM)
                    </span>
                    <div className="font-bold text-slate-900 mt-1">
                      {emp?.projectManagerId ? `${emp.projectManagerId.firstName} ${emp.projectManagerId.lastName}` : 'Not Assigned'}
                    </div>
                    {emp?.projectManagerId?.email && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{emp.projectManagerId.email}</div>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Resource Manager (RM)
                    </span>
                    <div className="font-bold text-slate-900 mt-1">
                      {emp?.resourceManagerId ? `${emp.resourceManagerId.firstName} ${emp.resourceManagerId.lastName}` : 'Not Assigned'}
                    </div>
                    {emp?.resourceManagerId?.email && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{emp.resourceManagerId.email}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar: Workspace & Role Summary */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-600" />
                  <span>Access & Security Level</span>
                </h3>

                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/90 space-y-2">
                  <div className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-orange-600" />
                    <span>{role?.name || user?.role || 'Staff Member'}</span>
                  </div>
                  <p className="text-[11px] text-orange-900/80 leading-relaxed font-medium">
                    {role?.description || 'Standard workspace member with self-service clock, leave, and timesheet capabilities.'}
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs border-t border-slate-100 text-slate-600">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Account ID:</span>
                    <span className="font-mono text-slate-800 text-[11px]">{user?._id || user?.id}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Workspace Tenant:</span>
                    <span className="font-bold text-slate-900">{org?.name || 'OneWayHR'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Active Currency:</span>
                    <span className="font-bold text-slate-900">{org?.currency || 'INR (₹)'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Timezone:</span>
                    <span className="font-bold text-slate-900">{org?.timezone || 'Asia/Kolkata'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PERSONAL & CONTACT INFORMATION (EDITABLE) */}
        {activeTab === 'personal' && (
          <form onSubmit={handleSavePersonal} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                <span>Personal & Residential Information</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Keep your residential address and contact details updated for formal correspondence and emergency reach.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={personalForm.name}
                  onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Personal Contact Phone</label>
                <input
                  type="text"
                  value={personalForm.phone}
                  onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Residential Address</label>
                <textarea
                  rows={2}
                  value={personalForm.currentAddress}
                  onChange={(e) => setPersonalForm({ ...personalForm, currentAddress: e.target.value })}
                  placeholder="Street address, apartment, city, state, pincode"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Hometown Address</label>
                <textarea
                  rows={2}
                  value={personalForm.permanentAddress}
                  onChange={(e) => setPersonalForm({ ...personalForm, permanentAddress: e.target.value })}
                  placeholder="Permanent native address as per Aadhaar / Passport"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-600" />
                <span>Designated Emergency Contact</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person Name</label>
                  <input
                    type="text"
                    value={personalForm.emergencyName}
                    onChange={(e) => setPersonalForm({ ...personalForm, emergencyName: e.target.value })}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <input
                    type="text"
                    value={personalForm.emergencyRelation}
                    onChange={(e) => setPersonalForm({ ...personalForm, emergencyRelation: e.target.value })}
                    placeholder="e.g. Spouse / Father / Mother"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Phone Number</label>
                  <input
                    type="text"
                    value={personalForm.emergencyPhone}
                    onChange={(e) => setPersonalForm({ ...personalForm, emergencyPhone: e.target.value })}
                    placeholder="+91 98111 22334"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save Personal Details'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: STATUTORY & BANKING DETAILS */}
        {activeTab === 'statutory' && (
          <form onSubmit={handleSaveStatutory} className="space-y-6">
            {/* Statutory Compliance Identifiers */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-600" />
                    <span>Statutory Compliance Identifiers</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Regulatory numbers utilized for EPF, ESI, and monthly Form 16 TDS processing.
                  </p>
                </div>
              </div>

              {/* Current Overview Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saved PAN Number</span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                    {emp?.panNumber || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saved Aadhaar</span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                    {emp?.aadhaarNumber ? `•••• •••• ${emp.aadhaarNumber.slice(-4)}` : <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saved UAN (EPF)</span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                    {emp?.uanNumber || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Saved ESI IP No.</span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                    {emp?.esiNumber || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </p>
                </div>
              </div>

              {/* Edit Statutory Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={statutoryForm.panNumber}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, panNumber: e.target.value.toUpperCase() })}
                    placeholder="Enter PAN"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Aadhaar Number</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={statutoryForm.aadhaarNumber}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="12-digit Aadhaar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">UAN (Universal Account)</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={statutoryForm.uanNumber}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, uanNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="12-digit UAN"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ESI IP Insurance No.</label>
                  <input
                    type="text"
                    maxLength={17}
                    value={statutoryForm.esiNumber}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, esiNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="ESI Number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Payroll Disbursal Bank Account */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Payroll Disbursal Bank Account</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Account linked for direct salary NEFT / RTGS credit every payroll cycle.
                  </p>
                </div>
              </div>

              {/* Current Overview Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Bank Name</span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {emp?.bankDetails?.bankName || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Account Number</span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                    {emp?.bankDetails?.accountNumber ? `•••• •••• ${emp.bankDetails.accountNumber.slice(-4)}` : <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">IFSC Code</span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                    {emp?.bankDetails?.ifscCode || <span className="text-slate-400 font-normal italic">Not Provided</span>}
                  </p>
                </div>
              </div>

              {/* Edit Bank Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={statutoryForm.bankName}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, bankName: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={statutoryForm.accountNumber}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                    placeholder="Account number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    maxLength={11}
                    value={statutoryForm.ifscCode}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="11-digit IFSC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={statutoryForm.accountHolderName}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, accountHolderName: e.target.value })}
                    placeholder="Name as in bank record"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={statutoryForm.branchName}
                    onChange={(e) => setStatutoryForm({ ...statutoryForm, branchName: e.target.value })}
                    placeholder="Bank branch location"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={statutorySaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.02]"
                >
                  {statutorySaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{statutorySaving ? 'Saving...' : 'Save Statutory & Bank Details'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6 max-w-xl">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-orange-600" />
                <span>Account Password & Credentials</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Change your login password. Must be at least 6 characters long.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current account password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new strong password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-enter new password to confirm"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {passwordSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>{passwordSaving ? 'Updating...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
