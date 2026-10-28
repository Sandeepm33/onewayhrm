'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  AlertCircle,
  ArrowUpRight,
  PartyPopper,
  Cake,
  Gift,
  Heart,
  Send,
  ChevronRight,
  Bell,
  FileText,
  Coffee,
  ShieldCheck,
  Activity,
  Check,
  X,
  Filter,
  RefreshCw,
  TrendingUp,
  Receipt,
  UserPlus,
  Compass,
} from 'lucide-react';
import WebClockWidget from '@/components/attendance/WebClockWidget';

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const [currentDate, setCurrentDate] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Welcome');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'inbox' | 'attendance' | 'culture'>('overview');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [wishedUsers, setWishedUsers] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/v1/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) setGreeting('Good morning');
    else if (hours < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setCurrentDate(
      now.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
    fetchDashboardData();
  }, [user]);

  // Quick Inline Approval for HROne Inbox
  const handleQuickApprove = async (requestId: string, action: 'APPROVED' | 'REJECTED') => {
    setApprovingId(requestId);
    try {
      const res = await fetch(`/api/v1/approvals/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          comments: `Quick 1-click ${action.toLowerCase()} from HROne Dashboard`,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setActionMessage({
          text: `Request successfully ${action === 'APPROVED' ? 'approved' : 'rejected'}.`,
          type: 'success',
        });
        fetchDashboardData();
      } else {
        setActionMessage({
          text: result.error || 'Failed to update request',
          type: 'info',
        });
      }
    } catch {
      setActionMessage({ text: 'Error executing approval action', type: 'info' });
    } finally {
      setApprovingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleSendWish = (id: string, name: string) => {
    setWishedUsers((prev) => [...prev, id]);
    setActionMessage({
      text: `Warm wishes sent to ${name}! 🎊`,
      type: 'success',
    });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const metrics = data?.metrics || {};
  const stats = data?.attendanceStats || {
    presentPercentage: 85,
    latePercentage: 8,
    onLeavePercentage: 5,
    absentPercentage: 2,
    avgClockIn: '09:28 AM',
    onTimeRate: '94.2%',
  };
  const pendingApprovals = data?.pendingApprovals || [];
  const holidays = data?.upcomingHolidays || [];
  const celebrations = data?.celebrations || [];
  const onLeave = data?.whoIsOnLeaveToday || [];
  const announcements = data?.announcements || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ACTION TOAST NOTIFICATION */}
        {actionMessage && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{actionMessage.text}</span>
          </div>
        )}

        {/* 1. HRONE HERO GREETING & INTERACTIVE PUNCH WIDGET */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-7 shadow-xl border border-slate-800">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-300 text-[11px] font-bold tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  {organization?.name || 'OneWayHR Platform'}
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-medium">{currentDate}</span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Sync
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                {greeting}, {user?.name?.split(' ')[0] || 'Leader'} <span className="inline-block animate-bounce">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 font-medium leading-relaxed">
                Welcome to your HROne Command Center. You have{' '}
                <span className="text-orange-400 font-bold underline decoration-orange-400/40 underline-offset-2">
                  {pendingApprovals.length} pending actions
                </span>{' '}
                and workforce synchronization is active.
              </p>

              {/* Quick Status Pill Bar */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    Present: <strong className="text-white font-bold">{metrics.presentToday ?? 4}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>
                    Late Marks: <strong className="text-white font-bold">{metrics.lateToday ?? 0}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>
                    On Leave: <strong className="text-white font-bold">{metrics.onLeaveToday ?? 0}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>
                    Total Strength: <strong className="text-white font-bold">{metrics.totalEmployees ?? 4}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Web Clock Widget (Embedded seamlessly) */}
            <div className="shrink-0 bg-slate-800/80 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-inner">
              <WebClockWidget variant="compact" onPunchSuccess={fetchDashboardData} />
            </div>
          </div>
        </div>

        {/* 2. HRONE INTERACTIVE TAB STRIP */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 rounded-2xl shadow-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'inbox'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Action Inbox</span>
              {pendingApprovals.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'inbox' ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {pendingApprovals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'attendance'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Team Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('culture')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'culture'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PartyPopper className="w-4 h-4" />
              <span>Culture & Events</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
            </button>
            <Link
              href="/self-service"
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>My Portal</span>
            </Link>
          </div>
        </div>

        {/* 3. HRONE PENDING ACTION HIGHLIGHT BANNER (If items pending) */}
        {pendingApprovals.length > 0 && activeTab === 'overview' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  You have {pendingApprovals.length} pending items requiring your sign-off
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Leave requests, attendance regularizations, and timesheet approvals await decision.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('inbox')}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Review In Inbox</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* HRONE 4 KEY PULSE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Workforce */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/80 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Strength</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {metrics.totalEmployees ?? 4}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {metrics.activeEmployees ?? 4} Active
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{metrics.probationEmployees ?? 0} on probation</span>
                    <Link href="/employees" className="text-blue-600 hover:underline font-bold flex items-center">
                      Directory <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card 2: Attendance */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/80 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Attendance</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {metrics.presentToday ?? 4}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {metrics.lateToday ?? 0} Late
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="text-emerald-600 font-semibold">{stats.onTimeRate} On-Time Rate</span>
                    <Link href="/attendance" className="text-emerald-600 hover:underline font-bold flex items-center">
                      Roster <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card 3: Monthly Payroll */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50/80 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Monthly Payroll</span>
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      ₹{(metrics.latestPayroll?.totalNetPay || 457600).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {metrics.latestPayroll?.status || 'APPROVED'}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Gross: ₹{(metrics.latestPayroll?.totalGrossPay || 515000).toLocaleString('en-IN')}</span>
                    <Link href="/payroll" className="text-orange-600 hover:underline font-bold flex items-center">
                      Run <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card 4: Recruitment */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50/80 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hiring Pipeline</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {metrics.openJobsCount ?? 2}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {metrics.totalCandidatesCount ?? 3} Candidates
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>1 Offer Stage</span>
                    <Link href="/recruitment" className="text-purple-600 hover:underline font-bold flex items-center">
                      ATS <ArrowUpRight className="w-3 h-3 ml-0.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* TWO COLUMN GRID: MAIN CONTENT (8 COLS) + SIDEBAR WIDGETS (4 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT 8 COLUMNS */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. QUICK SERVICES SPEED DIAL (HROne Style Dock) */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span>HROne Quick Operational Actions</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Frequently Used Shortcuts</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    <Link
                      href="/employees"
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 text-center transition-all group shadow-2xs flex flex-col items-center justify-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Employees</span>
                      <span className="text-[10px] text-slate-400">Master Roster</span>
                    </Link>

                    <Link
                      href="/attendance"
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 text-center transition-all group shadow-2xs flex flex-col items-center justify-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Attendance</span>
                      <span className="text-[10px] text-slate-400">Daily Log</span>
                    </Link>

                    <Link
                      href="/leave"
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-200 text-center transition-all group shadow-2xs flex flex-col items-center justify-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-100/70 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-purple-700">Apply Leave</span>
                      <span className="text-[10px] text-slate-400">Time Off</span>
                    </Link>

                    <Link
                      href="/payroll"
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-orange-50/70 border border-slate-200/80 hover:border-orange-200 text-center transition-all group shadow-2xs flex flex-col items-center justify-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-100/70 text-orange-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-orange-700">Payroll</span>
                      <span className="text-[10px] text-slate-400">Process Cycle</span>
                    </Link>

                    <Link
                      href="/expenses"
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/70 border border-slate-200/80 hover:border-amber-200 text-center transition-all group shadow-2xs flex flex-col items-center justify-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700">Expenses</span>
                      <span className="text-[10px] text-slate-400">Reimburse</span>
                    </Link>

                    <Link
                      href="/payslips"
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-pink-50/70 border border-slate-200/80 hover:border-pink-200 text-center transition-all group shadow-2xs flex flex-col items-center justify-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-pink-100/70 text-pink-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Download className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-pink-700">Payslips</span>
                      <span className="text-[10px] text-slate-400">Salary Slips</span>
                    </Link>
                  </div>
                </div>

                {/* 2. ATTENDANCE PULSE BREAKDOWN BAR */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Today&apos;s Workforce Distribution</h3>
                      <p className="text-xs text-slate-500 font-medium">Real-time biometric, facial & web attendance telemetry</p>
                    </div>
                    <div className="text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
                      Average Check-in: <span className="text-slate-900">{stats.avgClockIn}</span>
                    </div>
                  </div>

                  {/* Multi-Segment Color Bar */}
                  <div className="w-full h-4 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${stats.presentPercentage}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Present: ${stats.presentPercentage}%`}
                    />
                    <div
                      style={{ width: `${stats.latePercentage}%` }}
                      className="bg-amber-400 h-full transition-all"
                      title={`Late: ${stats.latePercentage}%`}
                    />
                    <div
                      style={{ width: `${stats.onLeavePercentage}%` }}
                      className="bg-purple-500 h-full transition-all"
                      title={`On Leave: ${stats.onLeavePercentage}%`}
                    />
                    <div
                      style={{ width: `${stats.absentPercentage}%` }}
                      className="bg-rose-400 h-full transition-all"
                      title={`Absent: ${stats.absentPercentage}%`}
                    />
                  </div>

                  {/* Legend Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[11px]">Present Today</span>
                        <strong className="text-slate-900 font-black text-sm">
                          {metrics.presentToday ?? 4} ({stats.presentPercentage}%)
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[11px]">Late Arrivals</span>
                        <strong className="text-slate-900 font-black text-sm">
                          {metrics.lateToday ?? 0} ({stats.latePercentage}%)
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[11px]">On Leave</span>
                        <strong className="text-slate-900 font-black text-sm">
                          {metrics.onLeaveToday ?? 0} ({stats.onLeavePercentage}%)
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0" />
                      <div>
                        <span className="text-slate-500 block text-[11px]">Absent</span>
                        <strong className="text-slate-900 font-black text-sm">
                          {metrics.absentToday ?? 0} ({stats.absentPercentage}%)
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. RECENT AUDIT TRAIL / ACTIVITY FEED */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-500" />
                        <span>Live Operations Stream & Audit Trail</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Immutable audit records from active tenant sessions</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                      auditlogs
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(data?.recentAuditLogs || []).slice(0, 5).map((log: any) => (
                      <div
                        key={log._id}
                        className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-100/80 text-orange-700 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {log.action?.replace(/_/g, ' ')}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Triggered by <span className="font-semibold text-slate-700">{log.userName || 'System Engine'}</span> • {log.entityType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] text-slate-400">
                          <span>{new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            VERIFIED
                          </span>
                        </div>
                      </div>
                    ))}

                    {(!data?.recentAuditLogs || data?.recentAuditLogs.length === 0) && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No recent audit records found.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT 4 COLUMNS: SIDEBAR WIDGETS */}
              <div className="lg:col-span-4 space-y-6">
                {/* 1. UPCOMING HOLIDAYS SPOTLIGHT (HROne signature) */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-orange-500" />
                      <span>Upcoming Holidays</span>
                    </h3>
                    <Link href="/attendance" className="text-xs font-bold text-orange-600 hover:underline">
                      View All
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {holidays.slice(0, 3).map((h: any) => (
                      <div
                        key={h._id || h.name}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-50/60 to-amber-50/30 border border-orange-200/70 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex flex-col items-center justify-center font-black shrink-0 shadow-sm leading-none">
                            <span className="text-[10px] uppercase font-bold text-orange-200">
                              {new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-sm mt-0.5">{new Date(h.date).getDate()}</span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{h.name}</h4>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                              {h.type} Holiday
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-white text-orange-700 text-[10px] font-bold border border-orange-200 shadow-2xs shrink-0">
                          {h.daysAway === 0 ? 'Today 🎉' : `In ${h.daysAway} days`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. CELEBRATIONS & SOCIAL PULSE (Birthdays & Anniversaries) */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <PartyPopper className="w-4 h-4 text-pink-500" />
                      <span>Team Celebrations</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[10px] font-bold border border-pink-200">
                      This Week
                    </span>
                  </div>

                  <div className="space-y-3">
                    {celebrations.map((item: any) => {
                      const isWished = wishedUsers.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                              {item.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                              <p className="text-[11px] text-slate-500">{item.title}</p>
                              <span className="text-[10px] font-semibold text-pink-600">{item.date}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSendWish(item.id, item.name)}
                            disabled={isWished}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                              isWished
                                ? 'bg-pink-100 text-pink-700 cursor-default'
                                : 'bg-pink-600 hover:bg-pink-700 text-white shadow-2xs'
                            }`}
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                            <span>{isWished ? 'Wished' : 'Wish'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. WHO IS ON LEAVE TODAY */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-purple-500" />
                      <span>Who&apos;s Away Today</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                      {onLeave.length} On Leave
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {onLeave.map((emp: any) => (
                      <div
                        key={emp.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{emp.code}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                          {emp.leaveType}
                        </span>
                      </div>
                    ))}

                    {onLeave.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-3 font-medium">
                        Entire workforce is present today!
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. COMPANY NOTICE BOARD */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold tracking-wider uppercase">
                      Notice Board
                    </span>
                    <span className="text-slate-400 text-[11px]">Oct 2026</span>
                  </div>

                  {announcements.slice(0, 1).map((ann: any) => (
                    <div key={ann.id}>
                      <h4 className="text-sm font-bold text-white mb-1.5">{ann.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">{ann.summary}</p>
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>By {ann.author}</span>
                        <span className="text-orange-400 font-semibold">{ann.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HRONE ACTION INBOX */}
        {activeTab === 'inbox' && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <span>Approvals & Request Inbox</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Review and sign off on pending employee requests directly without navigating away.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                {pendingApprovals.length} Pending
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">All Caught Up!</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  There are no pending approvals in your queue. Everything has been reviewed and cleared.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingApprovals.map((req: any) => (
                  <div
                    key={req._id}
                    className="py-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-2xl transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mt-0.5">
                        {req.module?.slice(0, 2) || 'AP'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {req.module}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{req.title}</span>
                        </div>
                        <p className="text-xs text-slate-600">{req.summary}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                          <span>
                            Requester:{' '}
                            <strong className="text-slate-700">
                              {req.requesterEmployeeId
                                ? `${req.requesterEmployeeId.firstName} ${req.requesterEmployeeId.lastName} (${req.requesterEmployeeId.employeeCode})`
                                : 'Team Member'}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>Submitted: {new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleQuickApprove(req._id, 'REJECTED')}
                        disabled={approvingId === req._id}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleQuickApprove(req._id, 'APPROVED')}
                        disabled={approvingId === req._id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{approvingId === req._id ? 'Processing...' : 'Approve'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEAM ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <span>Team Attendance Roster & Shift Tracking</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Detailed check-ins, active breaks, and compliance logs for today.
                </p>
              </div>
              <Link
                href="/attendance"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Full Attendance Module</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Present On Duty</span>
                <p className="text-2xl font-black text-emerald-950 mt-1">{metrics.presentToday ?? 4}</p>
                <p className="text-[11px] text-emerald-700 mt-1">Biometric & Web Clock verified</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Late Check-ins</span>
                <p className="text-2xl font-black text-amber-950 mt-1">{metrics.lateToday ?? 0}</p>
                <p className="text-[11px] text-amber-700 mt-1">After 09:45 AM threshold</p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Approved Leave</span>
                <p className="text-2xl font-black text-purple-950 mt-1">{metrics.onLeaveToday ?? 0}</p>
                <p className="text-[11px] text-purple-700 mt-1">Casual, Sick, or Earned leaves</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center py-10">
              <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Complete Biometric View</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                To view facial recognition logs, monthly calendar matrices, holiday policies, and punch regularization requests, jump into the dedicated module.
              </p>
              <Link
                href="/attendance"
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Open Attendance Roster</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* TAB 4: CULTURE & EVENTS */}
        {activeTab === 'culture' && (
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-pink-500" />
                <span>Culture, Celebrations & Internal Communications</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Engage with team members on birthdays, work milestones, and read company announcements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Celebrations */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Upcoming Birthdays & Milestones
                </h3>
                <div className="space-y-3">
                  {celebrations.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-gradient-to-br from-pink-50/50 to-orange-50/30 border border-pink-200/70 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-orange-400 text-white font-black flex items-center justify-center text-sm shadow-sm">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                          <span className="text-[11px] text-pink-600 font-bold block">{item.title}</span>
                          <span className="text-[10px] text-slate-500">{item.role}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendWish(item.id, item.name)}
                        disabled={wishedUsers.includes(item.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 disabled:bg-pink-100 disabled:text-pink-700"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>{wishedUsers.includes(item.id) ? 'Wished ❤️' : 'Send Wish'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Notice Board */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Official Company Broadcasts
                </h3>
                <div className="space-y-3">
                  {announcements.map((ann: any) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold">
                          {ann.category}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{ann.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{ann.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">{ann.summary}</p>
                      <p className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
                        Posted by {ann.author}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
