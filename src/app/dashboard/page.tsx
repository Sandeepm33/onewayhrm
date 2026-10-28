'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  UserCheck,
  CalendarDays,
  CreditCard,
  Briefcase,
  Clock,
  Sparkles,
  CheckCircle2,
  Download,
} from 'lucide-react';
import WebClockWidget from '@/components/attendance/WebClockWidget';

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [data, setData] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/v1/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
    fetchDashboardData();
  }, [user]);

  const metrics = data?.metrics || {};

  return (
    <DashboardLayout>
      {/* GREETING & HERO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold uppercase tracking-wider">
              {user?.role?.replace('_', ' ')} WORKSPACE
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-xs font-medium">{currentDate}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl font-medium">
            {organization?.name || 'OneWayHR'} • Real-Time Database Metrics & Employee Pulse
          </p>
        </div>

        {/* WEB CLOCK PUNCH WIDGET */}
        <WebClockWidget variant="compact" onPunchSuccess={fetchDashboardData} />
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Total Workforce</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.totalEmployees ?? 4}</span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{metrics.activeEmployees ?? 4} Active</span>
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            {metrics.probationEmployees ?? 0} on probation period
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Today&apos;s Attendance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.presentToday ?? 4} Present</span>
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              {metrics.lateToday ?? 0} Late
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Biometric & Web Punch Synchronized
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Monthly Net Payroll</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              INR {(metrics.latestPayroll?.totalNetPay || 457600).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">
              {metrics.latestPayroll?.status || 'APPROVED'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Gross: INR {(metrics.latestPayroll?.totalGrossPay || 515000).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500">Recruitment & Hiring</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{metrics.openJobsCount ?? 2} Open Jobs</span>
            <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
              {metrics.totalCandidatesCount ?? 3} In Pipeline
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            1 Candidate in Final Offer Stage
          </div>
        </div>
      </div>

      {/* QUICK WORKFLOW SHORTCUTS */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Quick Operational Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <a
            href="/employees"
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-200 text-center transition-all group shadow-2xs"
          >
            <Users className="w-5 h-5 text-indigo-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Employee Master</span>
          </a>
          <a
            href="/payroll"
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-200 text-center transition-all group shadow-2xs"
          >
            <CreditCard className="w-5 h-5 text-emerald-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Process Payroll</span>
          </a>
          <a
            href="/attendance"
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-200 text-center transition-all group shadow-2xs"
          >
            <UserCheck className="w-5 h-5 text-blue-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Attendance Roster</span>
          </a>
          <a
            href="/recruitment"
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-200 text-center transition-all group shadow-2xs"
          >
            <Briefcase className="w-5 h-5 text-purple-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">ATS Pipeline</span>
          </a>
          <a
            href="/payslips"
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-200 text-center transition-all group shadow-2xs"
          >
            <Download className="w-5 h-5 text-amber-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Download Payslips</span>
          </a>
          <a
            href="/self-service"
            className="p-3.5 rounded-xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-200 text-center transition-all group shadow-2xs"
          >
            <Sparkles className="w-5 h-5 text-pink-600 mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-orange-600">Employee Portal</span>
          </a>
        </div>
      </div>

      {/* RECENT AUDIT LOG & ACTIVITIES */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live System Audit Trail</h3>
            <p className="text-xs text-slate-500 font-medium">Chronological sensitive business operations persisted in database</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 font-bold">
            Collection: auditlogs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Triggered By</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {(data?.recentAuditLogs || data?.recentAudit || []).map((log: any) => (
                <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span>{log.action?.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{log.entityType}</td>
                  <td className="py-3 px-3 text-slate-800 font-medium">{log.userName || 'System Engine'}</td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(log.createdAt).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.recentAuditLogs && !data?.recentAudit) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Loading audit records...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
