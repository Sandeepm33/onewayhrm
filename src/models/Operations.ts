import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== PROJECT & TIMESHEET ====================
export interface IProject extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  clientName?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  assignedEmployees: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    clientName: String,
    status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD'], default: 'ACTIVE' },
    assignedEmployees: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
  },
  { timestamps: true }
);

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export interface ITimesheet extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  hours: number;
  description: string;
  isBillable: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimesheetSchema = new Schema<ITimesheet>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    date: { type: String, required: true, index: true },
    hours: { type: Number, required: true, min: 0.5, max: 24 },
    description: { type: String, required: true },
    isBillable: { type: Boolean, default: true },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'SUBMITTED' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Timesheet: Model<ITimesheet> =
  mongoose.models.Timesheet || mongoose.model<ITimesheet>('Timesheet', TimesheetSchema);

// ==================== EXPENSE CLAIM ====================
export interface IExpenseClaim extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  claimNumber: string;
  category: 'TRAVEL' | 'MEALS' | 'LODGING' | 'OFFICE_SUPPLIES' | 'INTERNET' | 'OTHER';
  amount: number;
  expenseDate: string;
  description: string;
  receiptUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reimbursedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseClaimSchema = new Schema<IExpenseClaim>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    claimNumber: { type: String, required: true },
    category: {
      type: String,
      enum: ['TRAVEL', 'MEALS', 'LODGING', 'OFFICE_SUPPLIES', 'INTERNET', 'OTHER'],
      required: true,
    },
    amount: { type: Number, required: true },
    expenseDate: { type: String, required: true },
    description: { type: String, required: true },
    receiptUrl: String,
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED'],
      default: 'PENDING',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    reimbursedAt: Date,
  },
  { timestamps: true }
);

export const ExpenseClaim: Model<IExpenseClaim> =
  mongoose.models.ExpenseClaim || mongoose.model<IExpenseClaim>('ExpenseClaim', ExpenseClaimSchema);

// ==================== PERFORMANCE & GOAL ====================
export interface IGoal extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'INDIVIDUAL' | 'TEAM' | 'COMPANY';
  targetDate: string;
  progressPercentage: number;
  weightage: number; // e.g. 20%
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  managerRating?: number; // 1 to 5
  managerFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    title: { type: String, required: true },
    description: String,
    category: { type: String, enum: ['INDIVIDUAL', 'TEAM', 'COMPANY'], default: 'INDIVIDUAL' },
    targetDate: String,
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    weightage: { type: Number, default: 20 },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'IN_PROGRESS',
    },
    managerRating: Number,
    managerFeedback: String,
  },
  { timestamps: true }
);

export const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);

// ==================== ASSET MANAGEMENT ====================
export interface IAsset extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string; // e.g. "MacBook Pro 16 M2"
  assetCode: string; // e.g. AST-001
  category: 'LAPTOP' | 'MONITOR' | 'MOBILE' | 'ACCESS_CARD' | 'OTHER';
  serialNumber?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'DISPOSED';
  assignedToEmployeeId?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  returnCondition?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    assetCode: { type: String, required: true },
    category: {
      type: String,
      enum: ['LAPTOP', 'MONITOR', 'MOBILE', 'ACCESS_CARD', 'OTHER'],
      default: 'LAPTOP',
    },
    serialNumber: String,
    purchaseDate: Date,
    purchaseCost: Number,
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'DISPOSED'],
      default: 'AVAILABLE',
    },
    assignedToEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    assignedAt: Date,
    returnCondition: String,
  },
  { timestamps: true }
);

AssetSchema.index({ organizationId: 1, assetCode: 1 }, { unique: true });

export const Asset: Model<IAsset> =
  mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);

// ==================== HELPDESK TICKETS ====================
export interface IHelpdeskTicket extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  ticketNumber: string;
  category: 'PAYROLL' | 'LEAVE' | 'IT_SUPPORT' | 'GENERAL_HR' | 'BENEFITS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedToUserId?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HelpdeskTicketSchema = new Schema<IHelpdeskTicket>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    ticketNumber: { type: String, required: true },
    category: {
      type: String,
      enum: ['PAYROLL', 'LEAVE', 'IT_SUPPORT', 'GENERAL_HR', 'BENEFITS'],
      default: 'GENERAL_HR',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
    },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: String,
  },
  { timestamps: true }
);

export const HelpdeskTicket: Model<IHelpdeskTicket> =
  mongoose.models.HelpdeskTicket ||
  mongoose.model<IHelpdeskTicket>('HelpdeskTicket', HelpdeskTicketSchema);

// ==================== AUDIT LOGS ====================
export interface IAuditLog extends Document {
  organizationId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  action: string; // e.g. "PAYROLL_RUN_APPROVED", "EMPLOYEE_CREATED", "LEAVE_REJECTED"
  entityType: string; // e.g. "PayrollRun", "Employee", "LeaveRequest"
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: String,
    details: { type: Schema.Types.Mixed },
    ipAddress: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
