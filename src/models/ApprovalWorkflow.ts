import mongoose, { Schema, Document, Model } from 'mongoose';

export type WorkflowModule =
  | 'LEAVE'
  | 'TIMESHEET'
  | 'ATTENDANCE_REGULARIZATION'
  | 'EXPENSE_CLAIM'
  | 'BUDGET_REVISION'
  | 'MANAGER_CHANGE';

export type ApproverType =
  | 'REPORTING_MANAGER'
  | 'TECHNICAL_LEAD'
  | 'DEPARTMENT_HEAD'
  | 'ROLE'
  | 'SPECIFIC_EMPLOYEE';

export interface IWorkflowStep {
  stepNumber: number;
  stepName: string;
  approverType: ApproverType;
  roleSlug?: string; // e.g. 'hr-manager', 'finance-controller'
  specificEmployeeId?: mongoose.Types.ObjectId;
}

export interface IApprovalWorkflow extends Document {
  organizationId: mongoose.Types.ObjectId;
  module: WorkflowModule;
  name: string;
  description?: string;
  isActive: boolean;
  steps: IWorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowStepSchema = new Schema<IWorkflowStep>(
  {
    stepNumber: { type: Number, required: true },
    stepName: { type: String, required: true },
    approverType: {
      type: String,
      enum: ['REPORTING_MANAGER', 'TECHNICAL_LEAD', 'DEPARTMENT_HEAD', 'ROLE', 'SPECIFIC_EMPLOYEE'],
      required: true,
    },
    roleSlug: { type: String },
    specificEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  },
  { _id: false }
);

const ApprovalWorkflowSchema = new Schema<IApprovalWorkflow>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    module: {
      type: String,
      enum: ['LEAVE', 'TIMESHEET', 'ATTENDANCE_REGULARIZATION', 'EXPENSE_CLAIM', 'BUDGET_REVISION', 'MANAGER_CHANGE'],
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    steps: [WorkflowStepSchema],
  },
  { timestamps: true }
);

ApprovalWorkflowSchema.index({ organizationId: 1, module: 1 });

export const ApprovalWorkflow: Model<IApprovalWorkflow> =
  mongoose.models.ApprovalWorkflow ||
  mongoose.model<IApprovalWorkflow>('ApprovalWorkflow', ApprovalWorkflowSchema);

// ==================== APPROVAL REQUEST INSTANCE ====================
export interface IStepAction {
  stepNumber: number;
  stepName: string;
  approverEmployeeId?: mongoose.Types.ObjectId;
  approverName?: string;
  action: 'APPROVED' | 'REJECTED' | 'DELEGATED';
  comments?: string;
  actedAt: Date;
}

export interface IApprovalRequest extends Document {
  organizationId: mongoose.Types.ObjectId;
  module: WorkflowModule;
  entityId: string; // ID of the Leave, Timesheet, Expense, etc.
  requestNumber: string;
  requesterEmployeeId: mongoose.Types.ObjectId;
  title: string;
  summary: string;
  details?: Record<string, any>;
  currentStepIndex: number;
  totalSteps: number;
  currentPendingRole?: string;
  currentPendingApproverIds: mongoose.Types.ObjectId[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  stepHistory: IStepAction[];
  createdAt: Date;
  updatedAt: Date;
}

const StepActionSchema = new Schema<IStepAction>(
  {
    stepNumber: Number,
    stepName: String,
    approverEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    approverName: String,
    action: { type: String, enum: ['APPROVED', 'REJECTED', 'DELEGATED'] },
    comments: String,
    actedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ApprovalRequestSchema = new Schema<IApprovalRequest>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    module: {
      type: String,
      enum: ['LEAVE', 'TIMESHEET', 'ATTENDANCE_REGULARIZATION', 'EXPENSE_CLAIM', 'BUDGET_REVISION', 'MANAGER_CHANGE'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true },
    requestNumber: { type: String, required: true },
    requesterEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    details: { type: Schema.Types.Mixed },
    currentStepIndex: { type: Number, default: 0 },
    totalSteps: { type: Number, default: 1 },
    currentPendingRole: String,
    currentPendingApproverIds: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    stepHistory: [StepActionSchema],
  },
  { timestamps: true }
);

ApprovalRequestSchema.index({ organizationId: 1, status: 1 });

export const ApprovalRequest: Model<IApprovalRequest> =
  mongoose.models.ApprovalRequest ||
  mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);
