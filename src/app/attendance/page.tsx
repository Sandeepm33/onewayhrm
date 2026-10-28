'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import WebClockWidget from '@/components/attendance/WebClockWidget';
import {
  UserCheck,
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  MapPin,
  Check,
  Ban,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Info,
  CalendarDays,
  Sparkles,
  Search,
  Filter,
  Edit2,
  Trash2,
  PartyPopper,
  ShieldCheck,
  Briefcase,
  RotateCcw,
  LogOut,
  Play,
} from 'lucide-react';

function AttendanceContent() {
  const { user, employee, roleData, hasPermission } = useAuth();
  const isPlatformOwner = user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_OWNER';
  const canCreate = hasPermission('attendance', 'create');
  const canApprove = hasPermission('attendance', 'approve');
  const canEdit = hasPermission('attendance', 'edit');
  const isSystemAdmin = isPlatformOwner || Boolean(roleData?.isSystemAdmin);
  const [userScope, setUserScope] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('EMPLOYEE');
  const [currentEmpId, setCurrentEmpId] = useState<string>('');

  const isAdminOrManager = isSystemAdmin || canApprove || userScope === 'ADMIN' || userScope === 'MANAGER';

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'calendar' | 'table' | 'holidays'>('calendar');

  // Employee Scope Filter (For Admin/Manager viewing specific employee's calendar or table)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  // Attendance state
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');

  // Calendar State & Current Time (Initialized in useEffect to prevent SSR dynamic prerender blocking)
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date | null>(null);
  const [todayStr, setTodayStr] = useState<string>('');
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    attendance?: any;
    holiday?: any;
    isWeekend: boolean;
  } | null>(null);

  // Holidays state
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayYear, setHolidayYear] = useState<number>(2026);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    type: 'GAZETTED',
    description: '',
    isMandatory: true,
  });
  const [holidaySaving, setHolidaySaving] = useState(false);

  // Regularization state
  const [regularizeModalOpen, setRegularizeModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    date: '',
    reason: '',
    checkIn: '09:30',
    checkOut: '18:30',
  });
  const [regSuccess, setRegSuccess] = useState('');

  // Client-side initialization of current date
  useEffect(() => {
    const now = new Date();
    setCurrentCalendarDate(now);
    setHolidayYear(now.getFullYear());
    const isoDate = now.toISOString().split('T')[0];
    setTodayStr(isoDate);
    setRegForm((f) => ({ ...f, date: isoDate }));
  }, []);

  // Current Month String (YYYY-MM)
  const currentMonthStr = useMemo(() => {
    if (!currentCalendarDate) return '2026-10';
    const y = currentCalendarDate.getFullYear();
    const m = String(currentCalendarDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, [currentCalendarDate]);

  // Fetch employees list for organization filter (admins/managers)
  const fetchEmployees = async () => {
    if (!isSystemAdmin && !canApprove) return;
    try {
      const res = await fetch('/api/v1/employees');
      const data = await res.json();
      if (data.success && userScope !== 'MANAGER') {
        setEmployeesList(data.employees || []);
      }
    } catch (e) {
      console.error('Failed to load employees for filter', e);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [isAdminOrManager, isSystemAdmin, canApprove]);

  // Fetch Attendance & Month Holidays
  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/attendance?month=${currentMonthStr}`;
      if (selectedDate && activeTab === 'table') {
        url = `/api/v1/attendance?date=${selectedDate}`;
      }

      if (selectedEmployeeId === 'MY') {
        url += '&myOnly=true';
      } else if (selectedEmployeeId && selectedEmployeeId !== 'ALL') {
        url += `&employeeId=${selectedEmployeeId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAttendances(data.attendances || []);
        if (data.holidays) {
          setHolidays(data.holidays);
        }
        if (data.userScope) {
          setUserScope(data.userScope);
        }
        if (data.currentEmployeeId) {
          setCurrentEmpId(data.currentEmployeeId);
        }
        if (data.userScope === 'MANAGER' && Array.isArray(data.subordinates)) {
          setEmployeesList(data.subordinates);
        }
      }
    } catch (e) {
      console.error('Failed to load attendance', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Holidays for selected holiday year
  const fetchHolidays = async () => {
    try {
      const res = await fetch(`/api/v1/holidays?year=${holidayYear}`);
      const data = await res.json();
      if (data.success) {
        setHolidays(data.holidays || []);
      }
    } catch (e) {
      console.error('Failed to load holidays', e);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentMonthStr, selectedDate, activeTab, selectedEmployeeId]);

  useEffect(() => {
    fetchHolidays();
  }, [holidayYear]);

  // Calendar Navigation
  const handlePrevMonth = () => {
    setCurrentCalendarDate((prev) => {
      const base = prev || new Date();
      return new Date(base.getFullYear(), base.getMonth() - 1, 1);
    });
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => {
      const base = prev || new Date();
      return new Date(base.getFullYear(), base.getMonth() + 1, 1);
    });
  };

  const handleCurrentMonth = () => {
    setCurrentCalendarDate(new Date());
  };

  // Holiday CRUD handlers
  const handleOpenAddHoliday = () => {
    setEditingHoliday(null);
    setHolidayForm({
      name: '',
      date: `${holidayYear}-01-01`,
      type: 'GAZETTED',
      description: '',
      isMandatory: true,
    });
    setHolidayModalOpen(true);
  };

  const handleOpenEditHoliday = (h: any) => {
    setEditingHoliday(h);
    setHolidayForm({
      name: h.name,
      date: h.date,
      type: h.type || 'GAZETTED',
      description: h.description || '',
      isMandatory: h.isMandatory !== undefined ? h.isMandatory : true,
    });
    setHolidayModalOpen(true);
  };

  const handleSaveHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setHolidaySaving(true);
    try {
      let url = '/api/v1/holidays';
      let method = 'POST';

      if (editingHoliday?._id) {
        url = `/api/v1/holidays/${editingHoliday._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holidayForm),
      });

      const data = await res.json();
      if (data.success) {
        setHolidayModalOpen(false);
        fetchHolidays();
        fetchAttendance();
      } else {
        alert(data.error || 'Failed to save holiday');
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred while saving holiday');
    } finally {
      setHolidaySaving(false);
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the holiday "${name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/holidays/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchHolidays();
        fetchAttendance();
      } else {
        alert(data.error || 'Failed to delete holiday');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting holiday');
    }
  };

  // Regularize handlers
  const handleRegularizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/attendance/regularize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (data.success) {
        setRegSuccess(data.message);
        setRegularizeModalOpen(false);
        fetchAttendance();
        setTimeout(() => setRegSuccess(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewRegularize = async (attendanceId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/v1/attendance/regularize', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceId, decision, reviewerRemarks: `Reviewed by ${user?.name}` }),
      });
      const data = await res.json();
      if (data.success) {
        fetchAttendance();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Direct Break In / Break Out / Clock Out handler for an employee
  const handlePunchForEmployee = async (employeeId: string, action: 'START_BREAK' | 'END_BREAK' | 'CLOCK_OUT' | 'CLOCK_IN', breakType = 'TEA') => {
    try {
      const res = await fetch('/api/v1/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          employeeId,
          breakType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAttendance();
        if (selectedDayDetail) {
          // If drawer is open, refresh detail
          setSelectedDayDetail(prev => prev ? {
            ...prev,
            attendance: data.attendance || prev.attendance
          } : null);
        }
      } else {
        alert(data.error || 'Failed to update employee punch');
      }
    } catch (e: any) {
      alert(e.message || 'Network error occurred');
    }
  };

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const baseDate = currentCalendarDate || new Date(2026, 9, 1);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const totalDays = lastDayOfMonth.getDate();
    // 0 is Sunday, adjust so Monday is first day of week (0: Mon, 6: Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      attendance?: any;
      holiday?: any;
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      const isWeekend = prevDate.getDay() === 0 || prevDate.getDay() === 6;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: false,
        isWeekend,
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const curDate = new Date(year, month, day);
      const dateStr = curDate.toISOString().split('T')[0];
      const isWeekend = curDate.getDay() === 0 || curDate.getDay() === 6;
      const isToday = todayStr ? dateStr === todayStr : false;

      // Match attendance for this date (strictly scoped to the selected employee!)
      const targetEmpId = selectedEmployeeId === 'MY' ? (employee?._id || user?.employeeId) : selectedEmployeeId;
      const attendance = attendances.find((a) => {
        if (a.date !== dateStr) return false;
        if (targetEmpId && targetEmpId !== 'ALL') {
          return String(a.employeeId?._id || a.employeeId) === String(targetEmpId);
        }
        return true;
      });

      // Match holiday for this date
      const holiday = holidays.find((h) => h.date === dateStr);

      days.push({
        dateStr,
        dayNum: day,
        isCurrentMonth: true,
        isToday,
        isWeekend,
        attendance,
        holiday,
      });
    }

    // Next month padding to fill a 35 or 42 grid
    const remainingSlots = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextDate = new Date(year, month + 1, i);
      const dateStr = nextDate.toISOString().split('T')[0];
      const isWeekend = nextDate.getDay() === 0 || nextDate.getDay() === 6;
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: false,
        isWeekend,
      });
    }

    return days;
  }, [currentCalendarDate, attendances, holidays, todayStr, selectedEmployeeId, employee, user]);

  // Monthly summary stats
  const monthlyStats = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let totalWorkMinutes = 0;

    attendances.forEach((a) => {
      if (a.status === 'PRESENT') presentCount++;
      if (a.status === 'LATE') lateCount++;
      if (a.status === 'HALF_DAY') halfDayCount++;
      totalWorkMinutes += a.workHoursMinutes || 0;
    });

    const monthHolidays = holidays.filter((h) => h.date.startsWith(currentMonthStr));

    return {
      presentCount,
      lateCount,
      halfDayCount,
      holidaysCount: monthHolidays.length,
      totalHours: (totalWorkMinutes / 60).toFixed(1),
    };
  }, [attendances, holidays, currentMonthStr]);

  const pendingRegularizations = attendances.filter(
    (a) => a.regularization?.requested && a.regularization?.status === 'PENDING'
  );

  return (
    <DashboardLayout>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-black uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-500" />
              Smart Attendance & Roster
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">Live Web Punches, Breaks & Calendar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Attendance & Holiday Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Clock in, track break sessions, view monthly shift calendar, and manage company holiday roster
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setRegularizeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold shadow-xs cursor-pointer transition-colors"
          >
            Request Regularization
          </button>
          {isAdminOrManager && (
            <button
              onClick={handleOpenAddHoliday}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Holiday</span>
            </button>
          )}
        </div>
      </div>

      {/* REGULARIZATION BANNER ALERT */}
      {regSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{regSuccess}</span>
        </div>
      )}

      {/* PENDING REGULARIZATIONS BANNER (FOR MANAGERS/ADMINS) */}
      {pendingRegularizations.length > 0 && isAdminOrManager && (
        <div className="p-4 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-xs">
          <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{pendingRegularizations.length} Attendance Regularization Request(s) Pending Review</span>
          </h3>
          <div className="space-y-2">
            {pendingRegularizations.map((reg) => (
              <div
                key={reg._id}
                className="p-3.5 rounded-2xl bg-white border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">
                      {reg.employeeId?.firstName} {reg.employeeId?.lastName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">({reg.employeeId?.employeeCode})</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-600 font-mono">Date: {reg.date}</span>
                  </div>
                  <p className="text-[11px] text-amber-900 mt-1 font-medium">
                    Reason: &quot;{reg.regularization?.reason}&quot; • Requested Check In: {reg.regularization?.requestedCheckIn ? new Date(reg.regularization.requestedCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReviewRegularize(reg._id, 'APPROVED')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleReviewRegularize(reg._id, 'REJECTED')}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HERO WEB CLOCK WIDGET (Attractive, rich, real-time clock in/out & breaks) */}
      <WebClockWidget variant="hero" onPunchSuccess={fetchAttendance} />

      {/* VIEW SELECTOR TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="inline-flex p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Monthly Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'table'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Punch Logs Table</span>
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'holidays'
                ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PartyPopper className="w-4 h-4" />
            <span>Holiday Management</span>
            <span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 text-[10px]">
              {holidays.length}
            </span>
          </button>
        </div>

        {/* MONTH STATS STRIP (Shown in Calendar view) */}
        {activeTab === 'calendar' && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 font-bold shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Present: <strong>{monthlyStats.presentCount}</strong></span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 font-bold shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Late: <strong>{monthlyStats.lateCount}</strong></span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-700 font-bold shadow-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Holidays: <strong>{monthlyStats.holidaysCount}</strong></span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 font-bold shadow-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-600" />
              <span>Total: <strong>{monthlyStats.totalHours} hrs</strong></span>
            </span>
          </div>
        )}
      </div>

      {/* TAB 1: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar Header / Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {currentCalendarDate ? currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Monthly Calendar'}
              </h2>
              <button
                onClick={handleCurrentMonth}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-3">
              {isAdminOrManager && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 hidden md:inline">Viewing Shifts:</span>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer shadow-xs"
                  >
                    <option value="MY">👤 My Shifts ({user?.name || 'Self'})</option>
                    <option value="ALL">🏢 All Employees (Combined)</option>
                    {employeesList.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.employeeCode} - {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer transition-colors"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-[11px] font-black uppercase tracking-wider text-slate-500 py-3">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span className="text-orange-600">Sat</span>
              <span className="text-orange-600">Sun</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-slate-900">
              {calendarDays.map((cell, idx) => {
                const hasPunch = !!cell.attendance;
                const isHoliday = !!cell.holiday;
                const isCurrentMonth = cell.isCurrentMonth;

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    onClick={() => {
                      if (isCurrentMonth) {
                        setSelectedDayDetail({
                          dateStr: cell.dateStr,
                          attendance: cell.attendance,
                          holiday: cell.holiday,
                          isWeekend: cell.isWeekend,
                        });
                      }
                    }}
                    className={`min-h-[105px] sm:min-h-[120px] p-2.5 transition-all relative flex flex-col justify-between cursor-pointer group ${
                      !isCurrentMonth
                        ? 'bg-slate-50/40 opacity-40 hover:opacity-70'
                        : cell.isToday
                        ? 'bg-orange-50/40 ring-1 ring-inset ring-orange-400'
                        : isHoliday
                        ? 'bg-indigo-50/30 hover:bg-indigo-50/60'
                        : cell.isWeekend
                        ? 'bg-slate-50/50 hover:bg-slate-100/60'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Top Row: Date Number and Indicators */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black rounded-lg w-6 h-6 flex items-center justify-center font-mono ${
                          cell.isToday
                            ? 'bg-orange-600 text-white shadow-xs'
                            : cell.isWeekend
                            ? 'text-slate-400'
                            : 'text-slate-800'
                        }`}
                      >
                        {cell.dayNum}
                      </span>

                      {/* Holiday indicator dot */}
                      {isHoliday && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Holiday
                        </span>
                      )}

                      {/* Weekend Tag if current month */}
                      {cell.isWeekend && !isHoliday && isCurrentMonth && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          Off
                        </span>
                      )}
                    </div>

                    {/* Middle Content: Punch Details or Holiday Title */}
                    <div className="my-1.5 space-y-1">
                      {isHoliday && (
                        <div className="p-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-[10px] font-bold text-indigo-900 truncate">
                          🎉 {cell.holiday.name}
                        </div>
                      )}

                      {hasPunch && (
                        <div className="space-y-0.5">
                          {/* Status Pill */}
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                                cell.attendance.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : cell.attendance.status === 'LATE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {cell.attendance.status}
                            </span>
                            {cell.attendance.workHoursMinutes > 0 && (
                              <span className="text-[10px] font-bold text-slate-600 font-mono">
                                {Math.floor(cell.attendance.workHoursMinutes / 60)}h{' '}
                                {cell.attendance.workHoursMinutes % 60}m
                              </span>
                            )}
                          </div>

                          {/* In / Out Timestamps */}
                          <div className="text-[10px] font-mono font-medium text-slate-600 flex items-center justify-between pt-0.5">
                            <span className="text-emerald-700">
                              {cell.attendance.checkIn
                                ? new Date(cell.attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : '—'}
                            </span>
                            <span className="text-slate-300">→</span>
                            <span className="text-orange-700">
                              {cell.attendance.checkOut
                                ? new Date(cell.attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : cell.isToday
                                ? 'Active'
                                : '—'}
                            </span>
                          </div>

                          {/* Break summary pill if taken */}
                          {cell.attendance.totalBreakMinutes > 0 && (
                            <div className="text-[9px] font-semibold text-amber-800 flex items-center gap-1">
                              <Coffee className="w-2.5 h-2.5 text-amber-600" />
                              <span>{cell.attendance.totalBreakMinutes}m break</span>
                            </div>
                          )}
                        </div>
                      )}

                      {!hasPunch && !isHoliday && !cell.isWeekend && isCurrentMonth && (
                        <div className="text-[10px] text-slate-300 font-medium italic">
                          No punches
                        </div>
                      )}
                    </div>

                    {/* Bottom: subtle view hint on hover */}
                    <div className="text-[9px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Click details
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PUNCH LOGS TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* FILTER BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-700 font-bold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-orange-500" />
                Filter by Exact Date:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium focus:bg-white focus:border-orange-500"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
                >
                  Clear Date
                </button>
              )}

              {(userScope === 'ADMIN' || userScope === 'MANAGER' || isAdminOrManager) && (
                <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                  <span className="text-slate-600 font-bold">Scope:</span>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:bg-white focus:border-orange-500"
                  >
                    <option value="ALL">
                      {userScope === 'MANAGER' ? 'My Team & Myself' : 'All Organization Members'}
                    </option>
                    <option value="MY">Only My Punches</option>
                    {employeesList.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="text-slate-500 font-semibold text-[11px]">
              Showing {attendances.length} attendance record(s)
            </div>
          </div>

          {/* ATTENDANCE TABLE */}
          <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-black uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Clock In</th>
                    <th className="py-3.5 px-4">Breaks Taken</th>
                    <th className="py-3.5 px-4">Clock Out</th>
                    <th className="py-3.5 px-4">Net Duration</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Break & Shift Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendances.map((att) => (
                    <tr key={att._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                        {att.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {att.employeeId?.firstName} {att.employeeId?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {att.employeeId?.employeeCode || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-emerald-700 font-semibold font-mono">
                        {att.checkIn
                          ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {att.breaks && att.breaks.length > 0 ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[10px]">
                              <Coffee className="w-3 h-3 text-amber-600" />
                              {att.breaks.length} break{att.breaks.length > 1 ? 's' : ''} ({att.totalBreakMinutes || 0}m)
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                              {att.breaks.map((b: any, bIdx: number) => (
                                <div key={bIdx} className="flex items-center gap-1">
                                  <span className="text-amber-800 font-bold">In: {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-emerald-700 font-bold">{b.endTime ? `Out: ${new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Out: In Progress'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">0 breaks</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-orange-700 font-semibold font-mono">
                        {att.checkOut
                          ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                        {att.workHoursMinutes > 0
                          ? `${Math.floor(att.workHoursMinutes / 60)}h ${att.workHoursMinutes % 60}m`
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          <span>{att.workLocation}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            att.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : att.status === 'LATE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {(() => {
                          const isSelf =
                            (att.employeeId?._id && employee?._id && att.employeeId._id.toString() === employee._id.toString()) ||
                            (att.employeeId?._id && currentEmpId && att.employeeId._id.toString() === currentEmpId.toString()) ||
                            (att.employeeId?._id && user?.employeeId && att.employeeId._id.toString() === user.employeeId.toString()) ||
                            (att.employeeId?.email && user?.email && att.employeeId.email.toLowerCase() === user.email.toLowerCase());

                          if (att.checkIn && !att.checkOut) {
                            if (isSelf || isSystemAdmin) {
                              return (
                                <div className="flex items-center justify-end gap-1.5">
                                  {att.breaks?.some((b: any) => !b.endTime) ? (
                                    <button
                                      type="button"
                                      onClick={() => handlePunchForEmployee(att.employeeId?._id || att.employeeId, 'END_BREAK')}
                                      className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer animate-pulse"
                                      title="Break Out: End break"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Break Out</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handlePunchForEmployee(att.employeeId?._id || att.employeeId, 'START_BREAK', 'TEA')}
                                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                                      title="Break In: Start break"
                                    >
                                      <Coffee className="w-3 h-3 text-amber-600" />
                                      <span>Break In</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Clock out ${att.employeeId?.firstName || 'employee'}?`)) {
                                        handlePunchForEmployee(att.employeeId?._id || att.employeeId, 'CLOCK_OUT');
                                      }
                                    }}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Clock out employee"
                                  >
                                    <LogOut className="w-3 h-3 text-rose-400" />
                                    <span>Clock Out</span>
                                  </button>
                                </div>
                              );
                            }

                            // Active shift status for subordinate employees viewed by Manager / TL
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{att.breaks?.some((b: any) => !b.endTime) ? 'On Break' : 'Active On Shift'}</span>
                              </span>
                            );
                          }

                          return (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {att.checkOut ? 'Shift Ended' : 'Not Clocked In'}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                  {attendances.length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No attendance logs recorded for this query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DYNAMIC HOLIDAY MANAGEMENT */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          {/* Holiday Header & Year selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  Dynamic Holiday Calendar
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">Official Company Time Off</span>
              </div>
              <h2 className="text-xl font-black text-slate-950">
                Company Paid Holidays ({holidayYear})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Holidays automatically synchronize with the Attendance Punch system, payroll payables, and employee leave requests.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Year Selector */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
                {[2025, 2026, 2027].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setHolidayYear(yr)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      holidayYear === yr ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>

              {isAdminOrManager && (
                <button
                  onClick={handleOpenAddHoliday}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Holiday</span>
                </button>
              )}
            </div>
          </div>

          {/* Holidays Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map((h) => {
              const holidayDate = new Date(h.date);
              const formattedDateStr = holidayDate.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const isPast = todayStr ? h.date < todayStr : false;
              const isToday = todayStr ? h.date === todayStr : false;

              return (
                <div
                  key={h._id || h.name}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          h.type === 'NATIONAL'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : h.type === 'GAZETTED'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : h.type === 'COMPANY'
                            ? 'bg-orange-50 text-orange-800 border-orange-200'
                            : 'bg-purple-50 text-purple-800 border-purple-200'
                        }`}
                      >
                        {h.type}
                      </span>

                      {isToday ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-600 text-white animate-pulse">
                          Today!
                        </span>
                      ) : isPast ? (
                        <span className="text-[10px] font-bold text-slate-400">Passed</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                      {h.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-slate-600 mt-1 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-orange-500" />
                      <span>{formattedDateStr}</span>
                    </p>

                    {h.description && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 font-medium">
                        {h.description}
                      </p>
                    )}
                  </div>

                  {/* Actions for Admin */}
                  {isAdminOrManager && (
                    <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEditHoliday(h)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        title="Edit Holiday"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(h._id, h.name)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY DETAIL DRAWER / MODAL (Clicked from Calendar View) */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <button
              onClick={() => setSelectedDayDetail(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                Attendance Day Inspection
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500 font-mono">{selectedDayDetail.dateStr}</span>
            </div>

            <h3 className="text-xl font-black text-slate-950 mb-3">
              {new Date(selectedDayDetail.dateStr).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>

            {/* If holiday on this day */}
            {selectedDayDetail.holiday && (
              <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs">
                <div className="flex items-center gap-2 font-black text-sm">
                  <PartyPopper className="w-4 h-4 text-indigo-600" />
                  <span>{selectedDayDetail.holiday.name}</span>
                </div>
                <p className="mt-1 font-medium text-indigo-800">
                  {selectedDayDetail.holiday.description || 'Official statutory company holiday.'}
                </p>
              </div>
            )}

            {/* Attendance Punch details */}
            {selectedDayDetail.attendance ? (
              <div className="space-y-4">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 block">Clock In</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {selectedDayDetail.attendance.checkIn
                        ? new Date(selectedDayDetail.attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                      Location: {selectedDayDetail.attendance.workLocation}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-[11px] font-bold text-slate-400 block">Clock Out</span>
                    <span className="text-base font-black text-orange-700 font-mono">
                      {selectedDayDetail.attendance.checkOut
                        ? new Date(selectedDayDetail.attendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Shift In Progress'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                      Status: {selectedDayDetail.attendance.status}
                    </span>
                  </div>
                </div>

                {/* Net Hours & Breaks */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-600">Net Work Hours:</span>
                    <span className="text-slate-900 font-mono text-sm font-black">
                      {Math.floor(selectedDayDetail.attendance.workHoursMinutes / 60)}h{' '}
                      {selectedDayDetail.attendance.workHoursMinutes % 60}m
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600">Total Breaks Deducted:</span>
                    <span className="text-amber-700 font-mono">
                      {selectedDayDetail.attendance.totalBreakMinutes || 0} mins
                    </span>
                  </div>
                </div>

                {/* Breakdown of Breaks with Explicit Break In & Break Out */}
                {selectedDayDetail.attendance.breaks && selectedDayDetail.attendance.breaks.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5 text-amber-600" />
                      <span>Break Sessions Timeline ({selectedDayDetail.attendance.breaks.length})</span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedDayDetail.attendance.breaks.map((b: any, bIdx: number) => (
                        <div
                          key={bIdx}
                          className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              {b.type || 'General'} Break
                            </span>
                            <span className="font-black text-amber-900 font-mono text-[11px] bg-amber-100/80 px-2 py-0.5 rounded-md">
                              {b.durationMinutes ? `${b.durationMinutes} mins` : 'Active / In Progress'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-mono mt-0.5">
                            <div className="flex items-center gap-1 text-slate-700">
                              <span className="font-bold text-amber-800">Break In:</span>
                              <span className="font-semibold text-slate-900">
                                {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-slate-300">→</span>
                            <div className="flex items-center gap-1 text-slate-700">
                              <span className="font-bold text-emerald-800">Break Out:</span>
                              <span className="font-semibold text-slate-900">
                                {b.endTime
                                  ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Not yet (Active)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Break / Clock Out Controls in Day Inspection Modal */}
                {selectedDayDetail.attendance && !selectedDayDetail.attendance.checkOut && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Shift in Progress</span>
                      <span className="text-[10px] text-slate-500 font-medium">Manage employee break or end day</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedDayDetail.attendance.breaks?.some((b: any) => !b.endTime) ? (
                        <button
                          type="button"
                          onClick={() => handlePunchForEmployee(selectedDayDetail.attendance.employeeId?._id || selectedDayDetail.attendance.employeeId, 'END_BREAK')}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Break Out</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePunchForEmployee(selectedDayDetail.attendance.employeeId?._id || selectedDayDetail.attendance.employeeId, 'START_BREAK', 'TEA')}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Coffee className="w-3.5 h-3.5 text-amber-600" />
                          <span>Break In</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Clock out this shift?')) {
                            handlePunchForEmployee(selectedDayDetail.attendance.employeeId?._id || selectedDayDetail.attendance.employeeId, 'CLOCK_OUT');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Clock Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs font-medium">
                No attendance punches logged for this date.
              </div>
            )}

            {/* Quick Regularize Shortcut */}
            <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRegForm((f) => ({ ...f, date: selectedDayDetail.dateStr }));
                  setSelectedDayDetail(null);
                  setRegularizeModalOpen(true);
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
              >
                Missed punch? Regularize this date
              </button>

              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT HOLIDAY MODAL */}
      {holidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative text-slate-900">
            <button
              onClick={() => setHolidayModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-slate-950 mb-1">
              {editingHoliday ? 'Edit Company Holiday' : 'Add New Company Holiday'}
            </h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Dynamic holiday will reflect instantly across attendance calendars and payroll.
            </p>

            <form onSubmit={handleSaveHoliday} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali (Deepavali), Founders Day..."
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Holiday Category</label>
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  >
                    <option value="NATIONAL">National Holiday</option>
                    <option value="GAZETTED">Gazetted Holiday</option>
                    <option value="COMPANY">Company Special</option>
                    <option value="RESTRICTED">Restricted / Optional</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Brief note about this company holiday..."
                  value={holidayForm.description}
                  onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isMandatory"
                  checked={holidayForm.isMandatory}
                  onChange={(e) => setHolidayForm({ ...holidayForm, isMandatory: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isMandatory" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Mandatory Paid Holiday (Office Closed)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setHolidayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={holidaySaving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  {holidaySaving ? 'Saving...' : editingHoliday ? 'Update Holiday' : 'Create Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGULARIZE REQUEST MODAL */}
      {regularizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative text-slate-900">
            <button
              onClick={() => setRegularizeModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-black text-slate-950 mb-1">Submit Attendance Regularization</h2>
            <p className="text-xs text-slate-500 mb-4 font-medium">Request missed punch correction for manager review and approval</p>
            <form onSubmit={handleRegularizeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date to Regularize *</label>
                <input
                  type="date"
                  required
                  value={regForm.date}
                  onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Check In</label>
                  <input
                    type="time"
                    value={regForm.checkIn}
                    onChange={(e) => setRegForm({ ...regForm, checkIn: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Check Out</label>
                  <input
                    type="time"
                    value={regForm.checkOut}
                    onChange={(e) => setRegForm({ ...regForm, checkOut: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={regForm.reason}
                  onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                  placeholder="e.g. Offsite client meeting; missed card punch due to biometric maintenance..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRegularizeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-extrabold shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-500 font-semibold text-xs">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mr-3" />
          <span>Loading Attendance & Roster Hub...</span>
        </div>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}
