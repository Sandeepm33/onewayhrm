import mongoose, { Schema, Document, Model } from 'mongoose';

export type AllocationStatus = 'ACTIVE' | 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export interface IProjectAllocation extends Document {
  organizationId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  roleInProject: string; // e.g. "Senior React Dev", "Tech Lead", "QA Specialist", "Solutions Architect"
  allocationPercentage: number; // e.g. 50%, 100%
  expectedHoursPerWeek: number; // e.g. 20 hrs for 50%, 40 hrs for 100%
  billableRatePerHour?: number; // Billing rate in org currency
  costRatePerHour?: number; // Cost rate for project budget calculation
  startDate: Date;
  endDate?: Date;
  status: AllocationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectAllocationSchema = new Schema<IProjectAllocation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    roleInProject: { type: String, required: true, default: 'Developer' },
    allocationPercentage: { type: Number, required: true, min: 1, max: 100, default: 100 },
    expectedHoursPerWeek: { type: Number, default: 40 },
    billableRatePerHour: { type: Number, default: 0 },
    costRatePerHour: { type: Number, default: 0 },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ['ACTIVE', 'PLANNED', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ProjectAllocationSchema.index({ organizationId: 1, employeeId: 1, status: 1 });
ProjectAllocationSchema.index({ organizationId: 1, projectId: 1, status: 1 });

export const ProjectAllocation: Model<IProjectAllocation> =
  mongoose.models.ProjectAllocation ||
  mongoose.model<IProjectAllocation>('ProjectAllocation', ProjectAllocationSchema);
