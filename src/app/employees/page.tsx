'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Search,
  Plus,
  Filter,
  Building,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  CreditCard,
  FileCheck,
} from 'lucide-react';

export default function EmployeesPage() {
  const { user, organization } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    joiningDate: '',
    employmentType: 'FULL_TIME',
    ctcAnnual: 720000,
    panNumber: '',
    aadhaarNumber: '',
    uanNumber: '',
    createPortalAccount: true,
  });

  useEffect(() => {
    setFormData((f) => ({ ...f, joiningDate: new Date().toISOString().split('T')[0] }));
  }, []);

  const fetchEmployees = async () => {
    try {
      let url = '/api/v1/employees?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (selectedStatus) url += `status=${encodeURIComponent(selectedStatus)}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setEmployees(json.employees || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/v1/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: 'MALE',
          joiningDate: new Date().toISOString().split('T')[0],
          employmentType: 'FULL_TIME',
          ctcAnnual: 720000,
          panNumber: '',
          aadhaarNumber: '',
          uanNumber: '',
          createPortalAccount: true,
        });
        fetchEmployees();
      } else {
        setError(data.error || 'Failed to add employee');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              Employee Directory
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">{employees.length} Records in Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Employee Master & Lifecycle
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Complete records with Indian statutory EPF, PAN, bank details, and compensation versions
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-transform hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Employee</span>
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by legal name, employee code, or work email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
          >
            <option value="">All Employment Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="NOTICE_PERIOD">Notice Period</option>
            <option value="RESIGNED">Resigned</option>
          </select>
        </div>
      </div>

      {/* REAL EMPLOYEES TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Gross Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joining Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-xs">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{emp.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-orange-600">
                    {emp.employeeCode}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{emp.designationId?.title || 'Staff Specialist'}</div>
                    <div className="text-[11px] text-slate-500">{emp.departmentId?.name || 'General Operations'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {emp.branchId?.name || 'Bengaluru HQ'}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">INR {(emp.grossMonthly || 0).toLocaleString('en-IN')}/mo</div>
                    <div className="text-[10px] text-slate-400 font-medium">CTC: INR {(emp.ctcAnnual || 0).toLocaleString('en-IN')}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emp.status === 'PROBATION'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-medium">
                    {new Date(emp.joiningDate).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}

              {employees.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No employees matching the search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ONBOARD EMPLOYEE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative my-8 text-slate-900">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <span>Onboard New Employee</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Calculates Indian salary components (50% Basic, HRA, EPF) and registers user credentials
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="e.g. Rahul"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="e.g. Varma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="rahul.varma@techcorp.in"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Annual CTC (INR)</label>
                  <input
                    type="number"
                    required
                    value={formData.ctcAnnual}
                    onChange={(e) => setFormData({ ...formData, ctcAnnual: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="900000"
                  />
                </div>
              </div>

              {/* Statutory details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 uppercase font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UAN (EPF)</label>
                  <input
                    type="text"
                    value={formData.uanNumber}
                    onChange={(e) => setFormData({ ...formData, uanNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="100902837482"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhaar (Last 4)</label>
                  <input
                    type="text"
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                    placeholder="XXXX-XXXX-1234"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="portalAcc"
                  checked={formData.createPortalAccount}
                  onChange={(e) => setFormData({ ...formData, createPortalAccount: e.target.checked })}
                  className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="portalAcc" className="text-xs text-slate-600 font-medium">
                  Provision Employee Self-Service login portal credentials (Default password: <code>Welcome@123</code>)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer transition-transform hover:scale-[1.02]"
                >
                  {saving ? 'Creating Record...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
