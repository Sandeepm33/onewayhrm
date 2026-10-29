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

    const empName = `${slip.employeeId?.firstName || ''} ${slip.employeeId?.lastName || ''}`.trim() || 'Employee';
    const pdfDoc = generatePayslipPDF({
      companyName: organization?.name || 'Organization Payroll',
      companyAddress: organization?.address?.line1 ? `${organization.address.line1}, ${organization.address.city || ''}` : undefined,
      payslipNumber: slip.payslipNumber,
      monthYear,
      employeeName: empName,
      employeeCode: slip.employeeId?.employeeCode || '-',
      designation: slip.employeeId?.designationId?.title || '-',
      department: slip.employeeId?.departmentId?.name || '-',
      panNumber: slip.employeeId?.panNumber || '-',
      uanNumber: slip.employeeId?.uanNumber || '-',
      bankName: slip.employeeId?.bankDetails?.bankName || 'Direct Transfer',
      accountNumber: slip.employeeId?.bankDetails?.accountNumber || '-',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200/60 text-orange-600 text-[10px] font-bold uppercase tracking-wider">
              EMPLOYEE SELF SERVICE (ESS)
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">{user?.email}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            My Personal Workplace Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View attendance punches, leave balances, download official payslips, and access HR services
          </p>
        </div>

        {/* PUNCH WIDGET */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl shrink-0">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-orange-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Today&apos;s Status</p>
            <p className="text-xs font-bold text-slate-900">
              {todayAttendance?.checkIn
                ? `Clocked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : 'Not Clocked In Yet'}
            </p>
          </div>
          <button
            onClick={handlePunch}
            disabled={punchLoading}
            className="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {punchLoading ? 'Saving...' : todayAttendance?.checkIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>
      </div>

      {punchMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{punchMessage}</span>
        </div>
      )}

      {/* LEAVE BALANCES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
            <span>Casual Leave Balance</span>
            <span className="font-bold text-orange-600">Total: {balance?.casualLeave?.total ?? 0}</span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {Math.max(0, (balance?.casualLeave?.total ?? 0) - (balance?.casualLeave?.used ?? 0))} Days
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Available for personal commitments</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
            <span>Sick Leave Balance</span>
            <span className="font-bold text-emerald-600">Total: {balance?.sickLeave?.total ?? 0}</span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {Math.max(0, (balance?.sickLeave?.total ?? 0) - (balance?.sickLeave?.used ?? 0))} Days
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Available for medical needs</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
            <span>Earned Privilege Leave</span>
            <span className="font-bold text-purple-600">Total: {balance?.earnedLeave?.total ?? 0}</span>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {Math.max(0, (balance?.earnedLeave?.total ?? 0) - (balance?.earnedLeave?.used ?? 0))} Days
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Eligible for annual carry-forward</p>
        </div>
      </div>

      {/* MY OFFICIAL PAYSLIPS */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">My Monthly Payslips</h3>
            <p className="text-xs text-slate-500 mt-0.5">Download digital PDFs for tax declarations and visa records</p>
          </div>
          <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/60">
            {payslips.length} Payslips
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Payslip Number</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Disbursed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslips.map((slip) => (
                <tr key={slip._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-orange-600">{slip.payslipNumber}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">Month {slip.month}/{slip.year}</td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">INR {(slip.grossEarnings || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 text-rose-600 font-medium">INR {(slip.totalDeductions || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 font-black text-emerald-600">INR {(slip.netSalary || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PAID
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDownloadPDF(slip)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-md shadow-orange-500/20 cursor-pointer transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
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
