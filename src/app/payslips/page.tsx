'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { generatePayslipPDF } from '@/lib/pdf-generator';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Calendar,
  X,
  CreditCard,
  Building2,
  Printer,
} from 'lucide-react';

export default function PayslipsPage() {
  const { user } = useAuth();
  const [payslips, setPayslips] = useState<any[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const fetchPayslips = async () => {
    try {
      const res = await fetch('/api/v1/payslips');
      const data = await res.json();
      if (data.success) {
        setPayslips(data.payslips || []);
        setOrganization(data.organization);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Salary Slips & Tax</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">{payslips.length} Official Payslips</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Payslip Generation & Archive
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Downloadable PDFs with statutory EPF, PT, TDS deductions, employer contributions, and bank references
          </p>
        </div>
      </div>

      {/* PAYSLIPS TABLE */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Payslip Number</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payslips.map((slip) => (
                <tr key={slip._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-indigo-400">
                    {slip.payslipNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">
                      {slip.employeeId?.firstName} {slip.employeeId?.lastName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {slip.employeeId?.employeeCode}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    Month {slip.month}/{slip.year}
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">
                    INR {(slip.grossEarnings || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-rose-400">
                    INR {(slip.totalDeductions || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                    INR {(slip.netSalary || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {slip.paymentStatus || 'PAID'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedPayslip(slip)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="View Detailed Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(slip)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] flex items-center gap-1 shadow-md shadow-indigo-600/20"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No payslips found. Execute and disburse a payroll run in the Payroll Engine to generate payslips.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED PAYSLIP BREAKDOWN MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedPayslip(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Salary Payslip — {selectedPayslip.payslipNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedPayslip.employeeId?.firstName} {selectedPayslip.employeeId?.lastName} ({selectedPayslip.employeeId?.employeeCode})
                </p>
              </div>
              <button
                onClick={() => handleDownloadPDF(selectedPayslip)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PDF</span>
              </button>
            </div>

            {/* Attendance & Account details */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs mb-4">
              <div>
                <span className="text-slate-500">PAN Number:</span>
                <p className="font-semibold text-white">{selectedPayslip.employeeId?.panNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">UAN (PF Number):</span>
                <p className="font-semibold text-white">{selectedPayslip.employeeId?.uanNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Bank & Account:</span>
                <p className="font-semibold text-white">{selectedPayslip.employeeId?.bankDetails?.bankName || 'HDFC Bank'}</p>
              </div>
              <div>
                <span className="text-slate-500">Payable Days:</span>
                <p className="font-semibold text-white">{selectedPayslip.payableDays} Days (Present: {selectedPayslip.presentDays})</p>
              </div>
            </div>

            {/* Columns Earnings vs Deductions */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Earnings */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-800">
                  Earnings
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Basic Salary:</span>
                    <span className="text-white font-medium">INR {selectedPayslip.basic?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">House Rent (HRA):</span>
                    <span className="text-white font-medium">INR {selectedPayslip.hra?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Special Allowance:</span>
                    <span className="text-white font-medium">INR {selectedPayslip.specialAllowance?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Conveyance:</span>
                    <span className="text-white font-medium">INR {selectedPayslip.conveyance?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-emerald-400">
                    <span>Total Gross:</span>
                    <span>INR {selectedPayslip.grossEarnings?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-800">
                  Deductions
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employee EPF (12%):</span>
                    <span className="text-white font-medium">INR {selectedPayslip.epfEmployee?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Professional Tax:</span>
                    <span className="text-white font-medium">INR {selectedPayslip.professionalTax?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TDS (Income Tax):</span>
                    <span className="text-white font-medium">INR {selectedPayslip.incomeTaxTds?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-rose-400">
                    <span>Total Deductions:</span>
                    <span>INR {selectedPayslip.totalDeductions?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-300">NET DISBURSED SALARY</span>
                <p className="text-[11px] text-slate-400">Transferred via NEFT to registered salary account</p>
              </div>
              <div className="text-xl font-extrabold text-emerald-400">
                INR {selectedPayslip.netSalary?.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
