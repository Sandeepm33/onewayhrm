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
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] text-orange-600 font-extrabold uppercase tracking-wider bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
              Salary Slips & Tax
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">{payslips.length} Official Payslips</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 flex items-center gap-2">
            Payslip Generation & Archive
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Downloadable PDFs with statutory EPF, PT, TDS deductions, employer contributions, and bank references
          </p>
        </div>
      </div>

      {/* PAYSLIPS TABLE */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
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
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payslips.map((slip) => (
                <tr key={slip._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-orange-600">
                    {slip.payslipNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {slip.employeeId?.firstName} {slip.employeeId?.lastName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {slip.employeeId?.employeeCode}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    Month {slip.month}/{slip.year}
                  </td>
                  <td className="py-3.5 px-4 text-slate-900 font-bold">
                    INR {(slip.grossEarnings || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-rose-600 font-semibold">
                    INR {(slip.totalDeductions || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                    INR {(slip.netSalary || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {slip.paymentStatus || 'PAID'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedPayslip(slip)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                        title="View Detailed Breakdown"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(slip)}
                        className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto text-slate-900">
            <button onClick={() => setSelectedPayslip(null)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Salary Payslip — {selectedPayslip.payslipNumber}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedPayslip.employeeId?.firstName} {selectedPayslip.employeeId?.lastName} ({selectedPayslip.employeeId?.employeeCode})
                </p>
              </div>
              <button
                onClick={() => handleDownloadPDF(selectedPayslip)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PDF</span>
              </button>
            </div>

            {/* Attendance & Account details */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-4">
              <div>
                <span className="text-slate-500 font-medium">PAN Number:</span>
                <p className="font-bold text-slate-900">{selectedPayslip.employeeId?.panNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">UAN (PF Number):</span>
                <p className="font-bold text-slate-900">{selectedPayslip.employeeId?.uanNumber || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Bank & Account:</span>
                <p className="font-bold text-slate-900">{selectedPayslip.employeeId?.bankDetails?.bankName || 'HDFC Bank'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Payable Days:</span>
                <p className="font-bold text-slate-900">{selectedPayslip.payableDays} Days (Present: {selectedPayslip.presentDays})</p>
              </div>
            </div>

            {/* Columns Earnings vs Deductions */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Earnings */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-200">
                  Earnings
                </h4>
                <div className="space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Salary:</span>
                    <span className="text-slate-900 font-bold">INR {selectedPayslip.basic?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">House Rent (HRA):</span>
                    <span className="text-slate-900 font-bold">INR {selectedPayslip.hra?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Special Allowance:</span>
                    <span className="text-slate-900 font-bold">INR {selectedPayslip.specialAllowance?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Conveyance:</span>
                    <span className="text-slate-900 font-bold">INR {selectedPayslip.conveyance?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-emerald-700">
                    <span>Total Gross:</span>
                    <span>INR {selectedPayslip.grossEarnings?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 pb-1 border-b border-slate-200">
                  Deductions
                </h4>
                <div className="space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Employee EPF (12%):</span>
                    <span className="text-slate-900 font-bold">INR {selectedPayslip.epfEmployee?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Professional Tax:</span>
                    <span className="text-slate-900 font-bold">INR {selectedPayslip.professionalTax?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TDS (Income Tax):</span>
                    <span className="text-slate-900 font-bold">INR {selectedPayslip.incomeTaxTds?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-extrabold text-rose-600">
                    <span>Total Deductions:</span>
                    <span>INR {selectedPayslip.totalDeductions?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800">NET DISBURSED SALARY</span>
                <p className="text-[11px] text-slate-500 font-medium">Transferred via NEFT to registered salary account</p>
              </div>
              <div className="text-xl font-black text-emerald-700">
                INR {selectedPayslip.netSalary?.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
