import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalaryStructure extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string; // e.g. "Standard India Full-Time Structure"
  description?: string;
  isDefault: boolean;
  components: {
    basicPercentageOfGross: number; // e.g. 50%
    hraPercentageOfBasic: number; // e.g. 50%
    specialAllowancePercentage: number;
    conveyanceFixed: number; // e.g. 1600
    epfEmployeeRate: number; // 12%
    epfEmployerRate: number; // 12%
    esiEmployeeRate: number; // 0.75%
    esiEmployerRate: number; // 3.25%
    professionalTaxMonthly: number; // e.g. 200
  };
  createdAt: Date;
  updatedAt: Date;
}

const SalaryStructureSchema = new Schema<ISalaryStructure>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    isDefault: { type: Boolean, default: true },
    components: {
      basicPercentageOfGross: { type: Number, default: 50 },
      hraPercentageOfBasic: { type: Number, default: 50 },
      specialAllowancePercentage: { type: Number, default: 20 },
      conveyanceFixed: { type: Number, default: 1600 },
      epfEmployeeRate: { type: Number, default: 12 },
      epfEmployerRate: { type: Number, default: 12 },
      esiEmployeeRate: { type: Number, default: 0.75 },
      esiEmployerRate: { type: Number, default: 3.25 },
      professionalTaxMonthly: { type: Number, default: 200 },
    },
  },
  { timestamps: true }
);

export const SalaryStructure: Model<ISalaryStructure> =
  mongoose.models.SalaryStructure || mongoose.model<ISalaryStructure>('SalaryStructure', SalaryStructureSchema);

export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'VALIDATED' | 'APPROVED' | 'LOCKED' | 'PAID';

export interface IPayrollRun extends Document {
  organizationId: mongoose.Types.ObjectId;
  month: number; // 1 to 12
  year: number; // e.g. 2026
  title: string; // "Payroll - October 2026"
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalEmployerCost: number; // Gross + Employer EPF + ESI + Gratuity
  status: PayrollStatus;
  processedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  paymentReference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayrollRunSchema = new Schema<IPayrollRun>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    title: { type: String, required: true },
    totalEmployees: { type: Number, default: 0 },
    totalGrossPay: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    totalNetPay: { type: Number, default: 0 },
    totalEmployerCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'CALCULATED', 'VALIDATED', 'APPROVED', 'LOCKED', 'PAID'],
      default: 'DRAFT',
    },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    paidAt: { type: Date },
    paymentReference: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

PayrollRunSchema.index({ organizationId: 1, month: 1, year: 1 }, { unique: true });

export const PayrollRun: Model<IPayrollRun> =
  mongoose.models.PayrollRun || mongoose.model<IPayrollRun>('PayrollRun', PayrollRunSchema);

export interface IPayslip extends Document {
  organizationId: mongoose.Types.ObjectId;
  payrollRunId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  month: number;
  year: number;
  payslipNumber: string; // e.g. PAY-2026-10-EMP001

  // Attendance metrics
  totalDaysInMonth: number;
  payableDays: number;
  presentDays: number;
  leaveDays: number;
  unpaidAbsenceDays: number;

  // Earnings Breakdown
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance: number;
  medicalAllowance: number;
  bonus: number;
  incentives: number;
  grossEarnings: number;

  // Deductions Breakdown
  epfEmployee: number;
  esiEmployee: number;
  professionalTax: number;
  incomeTaxTds: number;
  loanAdvanceDeduction: number;
  totalDeductions: number;

  // Net Pay
  netSalary: number;

  // Employer Contributions
  epfEmployer: number;
  esiEmployer: number;
  gratuityContribution: number;

  isPublished: boolean;
  publishedAt?: Date;
  paymentMethod: string; // "BANK_TRANSFER"
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayslipSchema = new Schema<IPayslip>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    payrollRunId: { type: Schema.Types.ObjectId, ref: 'PayrollRun', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    payslipNumber: { type: String, required: true },

    totalDaysInMonth: { type: Number, default: 30 },
    payableDays: { type: Number, default: 30 },
    presentDays: { type: Number, default: 22 },
    leaveDays: { type: Number, default: 0 },
    unpaidAbsenceDays: { type: Number, default: 0 },

    basic: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    conveyance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    incentives: { type: Number, default: 0 },
    grossEarnings: { type: Number, required: true },

    epfEmployee: { type: Number, default: 0 },
    esiEmployee: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    incomeTaxTds: { type: Number, default: 0 },
    loanAdvanceDeduction: { type: Number, default: 0 },
    totalDeductions: { type: Number, required: true },

    netSalary: { type: Number, required: true },

    epfEmployer: { type: Number, default: 0 },
    esiEmployer: { type: Number, default: 0 },
    gratuityContribution: { type: Number, default: 0 },

    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    paymentMethod: { type: String, default: 'BANK_TRANSFER' },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    paymentReference: { type: String },
  },
  { timestamps: true }
);

PayslipSchema.index({ organizationId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });

export const Payslip: Model<IPayslip> =
  mongoose.models.Payslip || mongoose.model<IPayslip>('Payslip', PayslipSchema);
