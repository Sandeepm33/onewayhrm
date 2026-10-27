import mongoose, { Schema, Document, Model } from 'mongoose';

export type BudgetType = 'ANNUAL' | 'DEPARTMENT' | 'PROJECT' | 'COST_CENTER';
export type BudgetStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REVISED' | 'CLOSED';

export interface IBudget extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  budgetCode: string;
  budgetType: BudgetType;
  departmentId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  costCenterCode?: string;
  financialYear: string; // e.g. "2026-2027"
  startDate: Date;
  endDate: Date;
  
  // Financial buckets
  approvedAmount: number; // Total approved budget
  committedLaborCost: number; // Planned resource allocations
  committedExpenseCost: number; // Software, infrastructure, travel, etc.
  actualSpent: number; // Realized costs from payroll, approved expenses, timesheets
  forecastSpent: number; // Projected year/project-end spend
  currency: string;
  
  status: BudgetStatus;
  approvedByUserId?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    budgetCode: { type: String, required: true, uppercase: true, trim: true },
    budgetType: {
      type: String,
      enum: ['ANNUAL', 'DEPARTMENT', 'PROJECT', 'COST_CENTER'],
      default: 'PROJECT',
    },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    costCenterCode: { type: String, default: '' },
    financialYear: { type: String, default: '2026-2027' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    approvedAmount: { type: Number, required: true, default: 0 },
    committedLaborCost: { type: Number, default: 0 },
    committedExpenseCost: { type: Number, default: 0 },
    actualSpent: { type: Number, default: 0 },
    forecastSpent: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },

    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REVISED', 'CLOSED'],
      default: 'APPROVED',
    },
    approvedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

BudgetSchema.index({ organizationId: 1, budgetCode: 1 }, { unique: true });
BudgetSchema.index({ organizationId: 1, budgetType: 1 });

export const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);

// ==================== BUDGET REVISION ====================
export interface IBudgetRevision extends Document {
  organizationId: mongoose.Types.ObjectId;
  budgetId: mongoose.Types.ObjectId;
  revisionNumber: number;
  previousAmount: number;
  requestedAmount: number;
  difference: number;
  reason: string;
  requestedByUserId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedByUserId?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetRevisionSchema = new Schema<IBudgetRevision>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    budgetId: { type: Schema.Types.ObjectId, ref: 'Budget', required: true, index: true },
    revisionNumber: { type: Number, required: true, default: 1 },
    previousAmount: { type: Number, required: true },
    requestedAmount: { type: Number, required: true },
    difference: { type: Number, required: true },
    reason: { type: String, required: true },
    requestedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    reviewedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    comments: { type: String, default: '' },
  },
  { timestamps: true }
);

export const BudgetRevision: Model<IBudgetRevision> =
  mongoose.models.BudgetRevision ||
  mongoose.model<IBudgetRevision>('BudgetRevision', BudgetRevisionSchema);
