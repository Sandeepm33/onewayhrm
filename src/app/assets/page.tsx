'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Laptop, Plus, CheckCircle2, UserCheck, X } from 'lucide-react';

export default function AssetsPage() {
  const { user, hasPermission } = useAuth();
  const canCreate = hasPermission('assets', 'create');
  const canEdit = hasPermission('assets', 'edit');
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'LAPTOP',
    serialNumber: '',
    purchaseCost: 85000,
  });

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/v1/assets');
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setForm({
          name: '',
          category: 'LAPTOP',
          serialNumber: '',
          purchaseCost: 85000,
        });
        fetchAssets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReturn = async (assetId: string) => {
    try {
      await fetch('/api/v1/assets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, assignedToEmployeeId: null, status: 'AVAILABLE' }),
      });
      fetchAssets();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold tracking-wider uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/60">
              IT & Infrastructure
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">{assets.length} Inventory Items</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            Asset Inventory & Allocations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Laptops, monitors, serial numbers, employee custody, and exit clearance verification
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset to Register</span>
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Asset Code</th>
                <th className="py-3.5 px-4">Asset Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Serial Number</th>
                <th className="py-3.5 px-4">Current Custody</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((ast) => (
                <tr key={ast._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-orange-600">{ast.assetCode}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{ast.name}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{ast.category}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 font-medium">{ast.serialNumber || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    {ast.assignedToEmployeeId ? (
                      <div>
                        <div className="font-bold text-slate-900">
                          {ast.assignedToEmployeeId.firstName} {ast.assignedToEmployeeId.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium">
                          {ast.assignedToEmployeeId.employeeCode}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic font-medium">Unassigned (Inventory)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ast.status === 'ASSIGNED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ast.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {ast.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {ast.status === 'ASSIGNED' && canEdit && (
                      <button
                        onClick={() => handleReturn(ast._id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Return Asset
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {assets.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No equipment registered in the inventory yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-black text-slate-900 mb-3">Add Asset to Register</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dell Latitude 7440 Core i7"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 cursor-pointer"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="MOBILE">Mobile Phone</option>
                    <option value="ACCESS_CARD">Access Card</option>
                    <option value="OTHER">Other Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={form.serialNumber}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    placeholder="CN-098765-ABC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost (INR)</label>
                <input
                  type="number"
                  value={form.purchaseCost}
                  onChange={(e) => setForm({ ...form, purchaseCost: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
