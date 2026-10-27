'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Laptop, Plus, CheckCircle2, UserCheck, X } from 'lucide-react';

export default function AssetsPage() {
  const { user } = useAuth();
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
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">IT & Infrastructure</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">{assets.length} Inventory Items</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Asset Inventory & Allocations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Laptops, monitors, serial numbers, employee custody, and exit clearance verification
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset to Register</span>
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Asset Code</th>
                <th className="py-3 px-4">Asset Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Current Custody</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assets.map((ast) => (
                <tr key={ast._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-indigo-400">{ast.assetCode}</td>
                  <td className="py-3.5 px-4 font-semibold text-white">{ast.name}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">{ast.category}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{ast.serialNumber || 'N/A'}</td>
                  <td className="py-3.5 px-4">
                    {ast.assignedToEmployeeId ? (
                      <div>
                        <div className="font-semibold text-white">
                          {ast.assignedToEmployeeId.firstName} {ast.assignedToEmployeeId.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {ast.assignedToEmployeeId.employeeCode}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">Unassigned (Inventory)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ast.status === 'ASSIGNED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : ast.status === 'AVAILABLE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {ast.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {ast.status === 'ASSIGNED' && (
                      <button
                        onClick={() => handleReturn(ast._id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                      >
                        Return Asset
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {assets.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No equipment registered in the inventory yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-3">Add Asset to Register</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dell Latitude 7440 Core i7"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="MONITOR">Monitor</option>
                    <option value="MOBILE">Mobile Phone</option>
                    <option value="ACCESS_CARD">Access Card</option>
                    <option value="OTHER">Other Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={form.serialNumber}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    placeholder="CN-098765-ABC"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Cost (INR)</label>
                <input
                  type="number"
                  value={form.purchaseCost}
                  onChange={(e) => setForm({ ...form, purchaseCost: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
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
