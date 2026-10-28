'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Coffee,
  LogOut,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Laptop,
  Car,
  ChevronDown,
  Sparkles,
  Utensils,
  CupSoda,
  MessageSquare,
} from 'lucide-react';

interface WebClockWidgetProps {
  variant?: 'card' | 'compact' | 'hero';
  onPunchSuccess?: () => void;
  className?: string;
}

export default function WebClockWidget({
  variant = 'card',
  onPunchSuccess,
  className = '',
}: WebClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [status, setStatus] = useState<'NOT_CLOCKED_IN' | 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT'>('NOT_CLOCKED_IN');
  const [record, setRecord] = useState<any>(null);
  const [activeBreak, setActiveBreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Work location selector
  const [location, setLocation] = useState<'OFFICE' | 'REMOTE' | 'FIELD'>('OFFICE');
  const [breakMenuOpen, setBreakMenuOpen] = useState(false);
  const [clockOutModalOpen, setClockOutModalOpen] = useState(false);

  // Live timer tick
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch current punch status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/attendance/punch');
      const data = await res.json();
      if (data.success) {
        setStatus(data.dayStatus);
        setRecord(data.record);
        setActiveBreak(data.activeBreak);
        if (data.record?.workLocation) {
          setLocation(data.record.workLocation);
        }
      }
    } catch (e) {
      console.error('Failed to load clock status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Execute punch action
  const handleAction = async (action: 'CLOCK_IN' | 'START_BREAK' | 'END_BREAK' | 'CLOCK_OUT', breakType?: string) => {
    setActionLoading(true);
    setFeedback(null);
    setBreakMenuOpen(false);
    setClockOutModalOpen(false);

    try {
      const res = await fetch('/api/v1/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          breakType,
          workLocation: location,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: data.message });
        if (data.dayStatus) setStatus(data.dayStatus);
        if (data.attendance) {
          setRecord(data.attendance);
          const active = data.attendance?.breaks?.find((b: any) => !b.endTime) || null;
          setActiveBreak(active);
        }
        await fetchStatus();
        if (onPunchSuccess) onPunchSuccess();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Action failed' });
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Network error' });
    } finally {
      setActionLoading(false);
      // Auto clear feedback after 4 seconds
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    }
  };

  // Calculate live shift working duration
  const getElapsedWorkTimeString = () => {
    if (!record?.checkIn) return '00h 00m 00s';
    const checkInMs = new Date(record.checkIn).getTime();
    const endMs = record.checkOut ? new Date(record.checkOut).getTime() : currentTime ? currentTime.getTime() : 0;

    // calculate total finished breaks
    let breakTotalMs = (record.totalBreakMinutes || 0) * 60 * 1000;
    // if currently on break, add active break elapsed
    if (activeBreak?.startTime && currentTime) {
      breakTotalMs += currentTime.getTime() - new Date(activeBreak.startTime).getTime();
    }

    const elapsedMs = Math.max(0, endMs - checkInMs - breakTotalMs);
    const secs = Math.floor((elapsedMs / 1000) % 60);
    const mins = Math.floor((elapsedMs / (1000 * 60)) % 60);
    const hrs = Math.floor(elapsedMs / (1000 * 60 * 60));

    return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  // Calculate live break elapsed time
  const getElapsedBreakTimeString = () => {
    if (!activeBreak?.startTime || !currentTime) return '00m 00s';
    const elapsedMs = Math.max(0, currentTime.getTime() - new Date(activeBreak.startTime).getTime());
    const secs = Math.floor((elapsedMs / 1000) % 60);
    const mins = Math.floor(elapsedMs / (1000 * 60));
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  };

  const formattedCurrentTime = currentTime
    ? currentTime.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  // COMPACT VARIANT (Optimized for topbars and headers)
  if (variant === 'compact') {
    return (
      <div className="relative">
        <div className={`flex items-center gap-3 bg-white border border-slate-200/90 p-2.5 sm:p-3 rounded-2xl shadow-xs ${className}`}>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-tight text-slate-900 font-mono">
                {formattedCurrentTime}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'WORKING'
                    ? 'bg-emerald-500 animate-ping'
                    : status === 'ON_BREAK'
                    ? 'bg-amber-500 animate-bounce'
                    : status === 'CLOCKED_OUT'
                    ? 'bg-slate-400'
                    : 'bg-orange-500'
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-semibold truncate">
              {status === 'WORKING'
                ? 'Working • Active Shift'
                : status === 'ON_BREAK'
                ? `On Break • In: ${activeBreak?.startTime ? new Date(activeBreak.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} (${getElapsedBreakTimeString()})`
                : status === 'CLOCKED_OUT'
                ? 'Shift Finished'
                : 'Web Clock In'}
            </p>
          </div>

          {/* Action button in compact mode */}
          <div className="flex items-center gap-1.5 ml-auto">
            {status === 'NOT_CLOCKED_IN' && (
              <button
                onClick={() => handleAction('CLOCK_IN')}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Clock In</span>
              </button>
            )}

            {status === 'WORKING' && (
              <div className="flex items-center gap-1.5 relative">
                {/* Break In Split Button */}
                <div className="relative inline-flex rounded-xl shadow-xs border border-amber-300 bg-amber-50">
                  <button
                    type="button"
                    onClick={() => handleAction('START_BREAK', 'GENERAL')}
                    disabled={actionLoading}
                    className="px-3 py-2 text-amber-900 hover:bg-amber-100 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors rounded-l-xl"
                    title="Click to Break In immediately"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span>Break In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakMenuOpen(!breakMenuOpen)}
                    disabled={actionLoading}
                    className="px-1.5 py-2 border-l border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer transition-colors rounded-r-xl flex items-center justify-center"
                    title="Select specific Break In type"
                  >
                    <ChevronDown className="w-3 h-3 text-amber-600" />
                  </button>

                  {breakMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
                        Choose Break In Type
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAction('START_BREAK', 'TEA')}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <CupSoda className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="font-extrabold">Tea / Coffee Break In</p>
                          <p className="text-[10px] text-slate-400">15 mins standard</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction('START_BREAK', 'LUNCH')}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <Utensils className="w-4 h-4 text-orange-600 shrink-0" />
                        <div>
                          <p className="font-extrabold">Lunch Break In</p>
                          <p className="text-[10px] text-slate-400">45-60 mins standard</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction('START_BREAK', 'PERSONAL')}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <p className="font-extrabold">Personal Break In</p>
                          <p className="text-[10px] text-slate-400">Quick personal errand</p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setClockOutModalOpen(true)}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Clock Out</span>
                </button>
              </div>
            )}

            {status === 'ON_BREAK' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAction('END_BREAK')}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer animate-pulse"
                  title="Break Out: End break and resume work"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Break Out</span>
                </button>
                <button
                  type="button"
                  onClick={() => setClockOutModalOpen(true)}
                  disabled={actionLoading}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                  title="Clock Out directly"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Clock Out</span>
                </button>
              </div>
            )}

            {status === 'CLOCKED_OUT' && (
              <button
                onClick={() => handleAction('CLOCK_IN')}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 cursor-pointer"
              >
                Clock In Again
              </button>
            )}
          </div>
        </div>

        {/* FEEDBACK TOAST IN COMPACT MODE */}
        {feedback && (
          <div
            className={`mt-2 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* CLOCK OUT MODAL IN COMPACT MODE */}
        {clockOutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 text-slate-900 animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-950">Clock Out Confirmation</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Are you sure you want to end your shift for today? Your total net hours will be finalized for payroll.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5 mb-5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Time:</span>
                  <span className="font-bold text-slate-900 font-mono">{getElapsedWorkTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Breaks Deducted:</span>
                  <span className="font-bold text-amber-600 font-mono">{record?.totalBreakMinutes || 0} mins</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setClockOutModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Continue Working
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('CLOCK_OUT')}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer"
                >
                  Yes, Clock Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // FULL HERO / CARD VARIANT (Vibrant, high-conversion, dynamic clock UI)
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 ${className}`}>
      {/* Subtle Background Glow Accents */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* TOP HEADER: LIVE CLOCK & STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
              <Sparkles className="w-3 h-3 text-orange-500" />
              Smart Attendance Punch
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold">{formattedDate}</span>
          </div>

          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 font-mono tracking-tight">
              {formattedCurrentTime}
            </h2>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">IST (UTC+5:30)</span>
          </div>
        </div>

        {/* LIVE STATUS PILL */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-2xl border text-xs font-extrabold flex items-center gap-2 shadow-xs transition-all ${
              status === 'WORKING'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : status === 'ON_BREAK'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : status === 'CLOCKED_OUT'
                ? 'bg-slate-100 text-slate-700 border-slate-200'
                : 'bg-orange-50 text-orange-800 border-orange-200'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'WORKING'
                  ? 'bg-emerald-500 animate-ping'
                  : status === 'ON_BREAK'
                  ? 'bg-amber-500 animate-bounce'
                  : status === 'CLOCKED_OUT'
                  ? 'bg-slate-400'
                  : 'bg-orange-500'
              }`}
            />
            <span>
              {status === 'WORKING'
                ? 'Status: Working (Active Shift)'
                : status === 'ON_BREAK'
                ? `On Break: ${activeBreak?.type || 'General'} (${getElapsedBreakTimeString()})`
                : status === 'CLOCKED_OUT'
                ? 'Shift Completed'
                : 'Status: Ready to Clock In'}
            </span>
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`mt-4 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* MIDDLE SECTION: TIMERS & METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
        {/* Effective Work Time */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Net Work Duration</span>
            <Clock className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {getElapsedWorkTimeString()}
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {record?.checkIn ? `Clocked In at ${new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Shift not started'}
          </p>
        </div>

        {/* Break Duration */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Total Break Time</span>
            <Coffee className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {record?.totalBreakMinutes || 0} mins
          </div>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            {record?.breaks?.length ? `${record.breaks.length} break session(s) taken` : '0 breaks recorded'}
          </p>
        </div>

        {/* Location & Shift Mode */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold mb-1">
            <span>Punch Location</span>
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          {status === 'NOT_CLOCKED_IN' ? (
            <div className="flex items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => setLocation('OFFICE')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                  location === 'OFFICE'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏢 Office
              </button>
              <button
                type="button"
                onClick={() => setLocation('REMOTE')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                  location === 'REMOTE'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🏠 Remote
              </button>
              <button
                type="button"
                onClick={() => setLocation('FIELD')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                  location === 'FIELD'
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🚗 Field
              </button>
            </div>
          ) : (
            <>
              <div className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>{record?.workLocation || location}</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Verified</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {record?.checkOut ? `Clocked out at ${new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Shift in progress'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ACTION CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-slate-500 font-medium">
          {status === 'WORKING' ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live time tracking active. Remember to clock breaks for payroll accuracy.
            </span>
          ) : status === 'ON_BREAK' ? (
            <span className="text-amber-800 font-semibold flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-amber-600" />
              Enjoy your {activeBreak?.type || 'break'}! Click &quot;Resume Work&quot; once back.
            </span>
          ) : status === 'CLOCKED_OUT' ? (
            <span className="text-slate-600 font-semibold">
              Shift logged for today. You can clock in again if continuing overtime work.
            </span>
          ) : (
            <span>Ready to punch in? Choose your work mode and press Clock In.</span>
          )}
        </div>

        {/* Dynamic Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end relative">
          {status === 'NOT_CLOCKED_IN' && (
            <button
              onClick={() => handleAction('CLOCK_IN')}
              disabled={actionLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 transition-all transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{actionLoading ? 'Clocking In...' : 'Clock In for Today'}</span>
            </button>
          )}

          {status === 'WORKING' && (
            <>
              {/* Break In Trigger Split Button */}
              <div className="relative inline-flex rounded-2xl shadow-xs border border-amber-300 bg-amber-50">
                <button
                  type="button"
                  onClick={() => handleAction('START_BREAK', 'GENERAL')}
                  disabled={actionLoading}
                  className="px-4 py-2.5 text-amber-900 hover:bg-amber-100 font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer rounded-l-2xl"
                  title="Click to Break In immediately"
                >
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span>Break In</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBreakMenuOpen(!breakMenuOpen)}
                  disabled={actionLoading}
                  className="px-2 py-2.5 border-l border-amber-300 text-amber-800 hover:bg-amber-100 cursor-pointer transition-colors rounded-r-2xl flex items-center justify-center"
                  title="Choose specific Break In type"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-amber-600" />
                </button>

                {breakMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
                      Choose Break In Type
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAction('START_BREAK', 'TEA')}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <CupSoda className="w-4 h-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-extrabold">Tea / Coffee Break In</p>
                        <p className="text-[10px] text-slate-400">15 mins standard</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction('START_BREAK', 'LUNCH')}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-900 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Utensils className="w-4 h-4 text-orange-600 shrink-0" />
                      <div>
                        <p className="font-extrabold">Lunch Break In</p>
                        <p className="text-[10px] text-slate-400">45-60 mins standard</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction('START_BREAK', 'PERSONAL')}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div>
                        <p className="font-extrabold">Personal Break In</p>
                        <p className="text-[10px] text-slate-400">Short personal errand</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Clock Out Button */}
              <button
                type="button"
                onClick={() => setClockOutModalOpen(true)}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out</span>
              </button>
            </>
          )}

          {status === 'ON_BREAK' && (
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleAction('END_BREAK')}
                disabled={actionLoading}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm shadow-lg shadow-amber-500/25 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer animate-pulse"
                title="End break and return to work"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{actionLoading ? 'Updating...' : 'Break Out (Back to Work)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setClockOutModalOpen(true)}
                disabled={actionLoading}
                className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md shadow-slate-900/20 transition-all flex items-center gap-2 cursor-pointer"
                title="Clock Out directly"
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out</span>
              </button>
            </div>
          )}

          {status === 'CLOCKED_OUT' && (
            <button
              onClick={() => handleAction('CLOCK_IN')}
              disabled={actionLoading}
              className="px-5 py-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-extrabold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current text-orange-600" />
              <span>Clock In Again</span>
            </button>
          )}
        </div>
      </div>

      {/* CLOCK OUT CONFIRMATION MODAL */}
      {clockOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-950">Clock Out Confirmation</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Are you sure you want to end your shift for today? Your total net hours will be finalized for payroll.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5 mb-5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Time:</span>
                <span className="font-bold text-slate-900 font-mono">{getElapsedWorkTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Breaks Deducted:</span>
                <span className="font-bold text-amber-600 font-mono">{record?.totalBreakMinutes || 0} mins</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setClockOutModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Continue Working
              </button>
              <button
                type="button"
                onClick={() => handleAction('CLOCK_OUT')}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md cursor-pointer"
              >
                Yes, Clock Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
