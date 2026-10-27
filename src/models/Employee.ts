import mongoose, { Schema, Document, Model } from 'mongoose';

export type EmploymentStatus = 'ACTIVE' | 'PROBATION' | 'NOTICE_PERIOD' | 'TERMINATED' | 'RESIGNED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';

export interface IEmployee extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  employeeCode: string; // e.g. EMP001
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: Date;
  joiningDate: Date;
  confirmationDate?: Date;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  
  // Organization mapping
  branchId?: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  designationId?: mongoose.Types.ObjectId;
  roleId?: mongoose.Types.ObjectId; // Assigned organization role
  reportingManagerId?: mongoose.Types.ObjectId; // HR Reporting Manager
  technicalLeadId?: mongoose.Types.ObjectId; // Team Lead / Technical Lead
  projectManagerId?: mongoose.Types.ObjectId; // Project Manager
  resourceManagerId?: mongoose.Types.ObjectId; // Resource Manager
  costCenter?: string;

  // Compensation overview
  ctcAnnual: number;
  grossMonthly: number;
  fullyLoadedMonthlyCost?: number; // Fully loaded employment cost for project & dept budgeting
  basicSalary: number;
  hra: number;
  specialAllowance: number;
  conveyanceAllowance: number;
  medicalAllowance: number;

  // Indian Statutory Identifiers
  panNumber?: string;
  aadhaarNumber?: string;
  uanNumber?: string; // Universal Account Number (EPF)
  esiNumber?: string;

  // Bank details for payroll transfer
  bankDetails: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    branchName?: string;
  };

  // Address & Emergency Contacts
  currentAddress?: string;
  permanentAddress?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };

  // Exit details
  exitDetails?: {
    resignationDate?: Date;
    noticePeriodDays?: number;
    lastWorkingDate?: Date;
    exitReason?: string;
    settlementStatus?: 'PENDING' | 'PROCESSED' | 'CANCELLED';
    relievingLetterIssued?: boolean;
    experienceLetterIssued?: boolean;
  };

  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    employeeCode: { type: String, required: true, trim: true, uppercase: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], default: 'MALE' },
    dateOfBirth: { type: Date },
    joiningDate: { type: Date, required: true },
    confirmationDate: { type: Date },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'],
      default: 'FULL_TIME',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED', 'RESIGNED'],
      default: 'ACTIVE',
    },

    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    designationId: { type: Schema.Types.ObjectId, ref: 'Designation' },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    reportingManagerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    technicalLeadId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    projectManagerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    resourceManagerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    costCenter: { type: String, default: '' },

    ctcAnnual: { type: Number, default: 600000 },
    grossMonthly: { type: Number, default: 50000 },
    fullyLoadedMonthlyCost: { type: Number, default: 62500 },
    basicSalary: { type: Number, default: 25000 },
    hra: { type: Number, default: 12500 },
    specialAllowance: { type: Number, default: 10900 },
    conveyanceAllowance: { type: Number, default: 1600 },
    medicalAllowance: { type: Number, default: 0 },

    panNumber: { type: String, uppercase: true, trim: true },
    aadhaarNumber: { type: String, trim: true },
    uanNumber: { type: String, trim: true },
    esiNumber: { type: String, trim: true },

    bankDetails: {
      accountHolderName: String,
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      branchName: String,
    },

    currentAddress: String,
    permanentAddress: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },

    exitDetails: {
      resignationDate: Date,
      noticePeriodDays: { type: Number, default: 30 },
      lastWorkingDate: Date,
      exitReason: String,
      settlementStatus: {
        type: String,
        enum: ['PENDING', 'PROCESSED', 'CANCELLED'],
        default: 'PENDING',
      },
      relievingLetterIssued: { type: Boolean, default: false },
      experienceLetterIssued: { type: Boolean, default: false },
    },

    profilePhoto: String,
  },
  { timestamps: true }
);

EmployeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
EmployeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);
