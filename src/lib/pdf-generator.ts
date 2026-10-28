import jsPDF from 'jspdf';

export interface PayslipPDFData {
  companyName: string;
  companyAddress?: string;
  payslipNumber: string;
  monthYear: string;
  employeeName: string;
  employeeCode: string;
  designation?: string;
  department?: string;
  panNumber?: string;
  uanNumber?: string;
  bankName?: string;
  accountNumber?: string;
  payableDays: number;
  presentDays: number;
  leaveDays: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  grossEarnings: number;
  epfEmployee: number;
  professionalTax: number;
  incomeTaxTds: number;
  totalDeductions: number;
  netSalary: number;
  paymentReference?: string;
}

export function generatePayslipPDF(data: PayslipPDFData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName || 'ONEWAYHR', 15, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyAddress || 'Indiranagar 100ft Road, Bengaluru, Karnataka, India - 560038', 15, 20);
  doc.text('CONFIDENTIAL SALARY PAYSLIP', 15, 26);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.monthYear.toUpperCase(), 195, 20, { align: 'right' });

  // Reset text color
  doc.setTextColor(30, 41, 59);

  // Employee Information Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 38, 180, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, 38, 180, 36, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', 20, 46);
  doc.text('Employee ID:', 20, 53);
  doc.text('Designation:', 20, 60);
  doc.text('Department:', 20, 67);

  doc.setFont('helvetica', 'normal');
  doc.text(data.employeeName, 55, 46);
  doc.text(data.employeeCode, 55, 53);
  doc.text(data.designation || 'Software Engineer', 55, 60);
  doc.text(data.department || 'Engineering', 55, 67);

  doc.setFont('helvetica', 'bold');
  doc.text('PAN Number:', 110, 46);
  doc.text('UAN (PF):', 110, 53);
  doc.text('Bank & A/C:', 110, 60);
  doc.text('Payable Days:', 110, 67);

  doc.setFont('helvetica', 'normal');
  doc.text(data.panNumber || 'N/A', 145, 46);
  doc.text(data.uanNumber || 'N/A', 145, 53);
  const bankDisplay = data.bankName
    ? `${data.bankName}${data.accountNumber ? ` (...${data.accountNumber.slice(-4)})` : ''}`
    : 'Direct Transfer';
  doc.text(bankDisplay, 145, 60);
  doc.text(`${data.payableDays} Days (Present: ${data.presentDays})`, 145, 67);

  // Table Headers
  const startY = 82;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, startY, 90, 8, 'F');
  doc.rect(105, startY, 90, 8, 'F');
  doc.rect(15, startY, 180, 8, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('EARNINGS', 20, startY + 5.5);
  doc.text('AMOUNT (INR)', 100, startY + 5.5, { align: 'right' });
  doc.text('DEDUCTIONS', 110, startY + 5.5);
  doc.text('AMOUNT (INR)', 190, startY + 5.5, { align: 'right' });

  // Rows
  const earnings = [
    { label: 'Basic Salary', amount: data.basic },
    { label: 'House Rent Allowance (HRA)', amount: data.hra },
    { label: 'Special Allowance', amount: data.specialAllowance },
    { label: 'Conveyance Allowance', amount: data.conveyance },
  ];

  const deductions = [
    { label: 'Provident Fund (EPF 12%)', amount: data.epfEmployee },
    { label: 'Professional Tax (PT)', amount: data.professionalTax },
    { label: 'Tax Deducted at Source (TDS)', amount: data.incomeTaxTds },
  ];

  let currentY = startY + 14;
  doc.setFont('helvetica', 'normal');

  const maxRows = Math.max(earnings.length, deductions.length);
  for (let i = 0; i < maxRows; i++) {
    const earn = earnings[i];
    const ded = deductions[i];

    if (earn) {
      doc.text(earn.label, 20, currentY);
      doc.text(earn.amount.toLocaleString('en-IN'), 100, currentY, { align: 'right' });
    }
    if (ded) {
      doc.text(ded.label, 110, currentY);
      doc.text(ded.amount.toLocaleString('en-IN'), 190, currentY, { align: 'right' });
    }
    currentY += 8;
  }

  // Totals Row
  currentY += 4;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, currentY, 90, 9, 'F');
  doc.rect(105, currentY, 90, 9, 'F');
  doc.rect(15, currentY, 180, 9, 'S');

  doc.setFont('helvetica', 'bold');
  doc.text('Gross Earnings:', 20, currentY + 6);
  doc.text(`INR ${data.grossEarnings.toLocaleString('en-IN')}`, 100, currentY + 6, { align: 'right' });

  doc.text('Total Deductions:', 110, currentY + 6);
  doc.text(`INR ${data.totalDeductions.toLocaleString('en-IN')}`, 190, currentY + 6, { align: 'right' });

  // Net Pay Highlight Box
  currentY += 16;
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(34, 197, 94); // green-500
  doc.rect(15, currentY, 180, 16, 'FD');

  doc.setTextColor(22, 101, 52); // green-800
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('NET SALARY PAYABLE:', 20, currentY + 10);
  doc.setFontSize(14);
  doc.text(`INR ${data.netSalary.toLocaleString('en-IN')}`, 190, currentY + 11, { align: 'right' });

  // Footer & Disclaimer
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a system generated payslip from OneWayHR. No physical signature is required.', 15, currentY + 30);
  doc.text(`Payment Reference: ${data.paymentReference || 'BANK-TRANSFER-VERIFIED'} | Generated on: ${new Date().toLocaleDateString('en-IN')}`, 15, currentY + 35);

  return doc;
}

export function generateOfferLetterPDF(
  companyName: string,
  candidateName: string,
  designation: string,
  ctcAnnual: number,
  joiningDate: string,
  branchCity: string
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName.toUpperCase(), 15, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL EMPLOYMENT OFFER LETTER', 15, 22);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 195, 40, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text(`Dear ${candidateName},`, 15, 50);

  doc.setFont('helvetica', 'normal');
  const letterBody = [
    `We are delighted to extend you an offer of employment with ${companyName} as ${designation}. We were thoroughly impressed with your technical capabilities, leadership, and experience during our interview rounds.`,
    '',
    `Key terms of this offer:`,
    `• Position: ${designation}`,
    `• Work Location: ${branchCity || 'Bengaluru'}, India`,
    `• Annual Cost to Company (CTC): INR ${Number(ctcAnnual).toLocaleString('en-IN')} per annum`,
    `• Expected Date of Joining: ${joiningDate || 'Immediate / Within 30 days'}`,
    '',
    `Your compensation will follow our standardized Indian statutory salary structure, comprising Basic Salary, House Rent Allowance, Special Allowances, and Employer Provident Fund contributions in full accordance with applicable laws.`,
    '',
    `Please sign below and return this offer letter within 5 working days to confirm your acceptance.`,
    '',
    `We warmly look forward to welcoming you to the ${companyName} family!`,
  ];

  let y = 60;
  for (const line of letterBody) {
    if (line === '') {
      y += 5;
    } else {
      const splitText = doc.splitTextToSize(line, 180);
      doc.text(splitText, 15, y);
      y += splitText.length * 6;
    }
  }

  // Signatures
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(`For ${companyName}`, 15, y);
  doc.text('Candidate Acceptance', 130, y);

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Signatory\nHead of People Operations', 15, y);
  doc.text(`Signature: __________________\nName: ${candidateName}\nDate: ____________________`, 130, y);

  return doc;
}
