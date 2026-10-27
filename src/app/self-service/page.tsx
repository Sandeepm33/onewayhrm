'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { generatePayslipPDF } from '@/lib/pdf-generator';
import {
  UserCheck2,
  Clock,
  CalendarDays,
  FileText,
  Download,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Plus,
} from 'lucide-react';

export default function SelfServicePage() {
  const { user, organization, employee } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState('');

  const fetchESSData = async () => {
    try {
      const [resBal, resPayslip, resAtt] = await Promise.all([
        fetch('/api/v1/leave/balances'),
        fetch('/api/v1/payslips'),
        fetch('/api/v1/attendance?date=' + new Date().toISOString().split('T')[0]),
      ]);
      const dataBal = await resBal.json();
      const dataPay = await resPayslip.json();
      const dataAtt = await resAtt.json();

      if (dataBal.success) setBalance(dataBal.balance);
      if (dataPay.success) setPayslips(dataPay.payslips || []);
      if (dataAtt.success && dataAtt.attendances?.length > 0) {
        setTodayAttendance(dataAtt.attendances[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchESSData();
  }, [user]);

  const handlePunch = async () => {
    setPunchLoading(true);
    setPunchMessage('');
    try {
      const res = await fetch('/api/v1/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workLocation: 'OFFICE' }),
      });
      const data = await res.json();
      if (data.success) {
        setPunchMessage(data.message);
        fetchESSData();
      } else {
        setPunchMessage(data.error || 'Punch failed');
      }
    } catch (e: any) {
      setPunchMessage(e.message);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleDownloadPDF = (slip: any) => {
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthYear = `${monthNames[slip.month]} ${slip.year}`;

    const pdfDoc = generatePayslipPDF({
      companyName: organization?.name || 'TechCorp Solutions India Pvt Ltd',
      companyAddress: organization?.address?.line1 ? `${organization.address.line1}, ${organization.address.city}, India` : undefined,
      payslipNumber: slip.payslipNumber,
      monthYear,
      employeeName: `${slip.employeeId?.firstName} ${slip.employeeId?.lastName}`,
      employeeCode: slip.employeeId?.employeeCode || 'EMP',
      designation: slip.employeeId?.designationId?.title || 'Engineer',
      department: slip.employeeId?.departmentId?.name || 'Engineering',
      panNumber: slip.employeeId?.panNumber || 'N/A',
      uanNumber: slip.employeeId?.uanNumber || 'N/A',
      bankName: slip.employeeId?.bankDetails?.bankName || 'HDFC Bank',
      accountNumber: slip.employeeId?.bankDetails?.accountNumber || 'Direct Transfer',
      payableDays: slip.payableDays || 30,
      presentDays: slip.presentDays || 22,
      leaveDays: slip.leaveDays || 0,
      basic: slip.basic,
      hra: slip.hra,
      specialAllowance: slip.specialAllowance,
      conveyance: slip.conveyance,
      grossEarnings: slip.grossEarnings,
      epfEmployee: slip.epfEmployee,
      professionalTax: slip.professionalTax,
      incomeTaxTds: slip.incomeTaxTds,
      totalDeductions: slip.totalDeductions,
      netSalary: slip.netSalary,
      paymentReference: slip.paymentReference,
    });

    pdfDoc.save(`${slip.payslipNumber}.pdf`);
  };

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              EMPLOYEE SELF SERVICE (ESS)
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">{user?.email}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            My Personal Workplace Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            View attendance punches, leave balances, download official payslips, and access HR services
          </p>
        </div>

        {/* PUNCH WIDGET */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-xl shrink-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Today&apos;s Status</p>
            <p className="text-xs font-semibold text-white">
              {todayAttendance?.checkIn
                ? `Clocked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : 'Not Clocked In Yet'}
            </p>
          </div>
          <button
            onClick={handlePunch}
            disabled={punchLoading}
            className="ml-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50"
          >
            {punchLoading ? 'Saving...' : todayAttendance?.checkIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>
      </div>

      {punchMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{punchMessage}</span>
        </div>
      )}

      {/* LEAVE BALANCES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Casual Leave Balance</span>
            <span className="font-semibold text-indigo-400">Total: {balance?.casualLeave?.total ?? 12}</span>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {(balance?.casualLeave?.total ?? 12) - (balance?.casualLeave?.used ?? 2)} Days
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Available for personal commitments</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Sick Leave Balance</span>
            <span className="font-semibold text-emerald-400">Total: {balance?.sickLeave?.total ?? 12}</span>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {(balance?.sickLeave?.total ?? 12) - (balance?.sickLeave?.used ?? 1)} Days
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Available for medical needs</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Earned Privilege Leave</span>
            <span className="font-semibold text-purple-400">Total: {balance?.earnedLeave?.total ?? 15}</span>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {(balance?.earnedLeave?.total ?? 15) - (balance?.earnedLeave?.used ?? 0)} Days
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Eligible for annual carry-forward</p>
        </div>
      </div>

      {/* MY OFFICIAL PAYSLIPS */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">My Monthly Payslips</h3>
            <p className="text-xs text-slate-400">Download digital PDFs for tax declarations and visa records</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{payslips.length} Payslips</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Payslip Number</th>
                <th className="pb-3">Period</th>
                <th className="pb-3">Gross Earnings</th>
                <th className="pb-3">Deductions</th>
                <th className="pb-3">Net Disbursed</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payslips.map((slip) => (
                <tr key={slip._id} className="hover:bg-slate-800/40">
                  <td className="py-3 font-mono font-medium text-indigo-400">{slip.payslipNumber}</td>
                  <td className="py-3 text-slate-300">Month {slip.month}/{slip.year}</td>
                  <td className="py-3 text-slate-200">INR {(slip.grossEarnings || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 text-rose-400">INR {(slip.totalDeductions || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 font-bold text-emerald-400">INR {(slip.netSalary || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400">
                      PAID
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleDownloadPDF(slip)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs inline-flex items-center gap-1 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No published payslips found for your account yet.
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
