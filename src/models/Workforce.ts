import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== TEAMS ====================
export interface ITeam extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  departmentId?: mongoose.Types.ObjectId;
  teamLeadId?: mongoose.Types.ObjectId;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    teamLeadId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    description: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

TeamSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Team: Model<ITeam> =
  mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

// ==================== TEAM MEMBERSHIP ====================
export interface ITeamMembership extends Document {
  organizationId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  roleInTeam: 'LEAD' | 'MEMBER' | 'CONTRIBUTOR';
  startDate: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const TeamMembershipSchema = new Schema<ITeamMembership>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    roleInTeam: { type: String, enum: ['LEAD', 'MEMBER', 'CONTRIBUTOR'], default: 'MEMBER' },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

TeamMembershipSchema.index({ teamId: 1, employeeId: 1, status: 1 });

export const TeamMembership: Model<ITeamMembership> =
  mongoose.models.TeamMembership || mongoose.model<ITeamMembership>('TeamMembership', TeamMembershipSchema);

// ==================== REPORTING RELATIONSHIPS ====================
export type ReportingRelationshipType =
  | 'HR_REPORTING_MANAGER'
  | 'TECHNICAL_LEAD'
  | 'PROJECT_MANAGER'
  | 'RESOURCE_MANAGER'
  | 'DOTTED_LINE';

export interface IReportingRelationship extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  managerEmployeeId: mongoose.Types.ObjectId;
  relationshipType: ReportingRelationshipType;
  effectiveStartDate: Date;
  effectiveEndDate?: Date;
  isPrimary: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportingRelationshipSchema = new Schema<IReportingRelationship>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    managerEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    relationshipType: {
      type: String,
      enum: ['HR_REPORTING_MANAGER', 'TECHNICAL_LEAD', 'PROJECT_MANAGER', 'RESOURCE_MANAGER', 'DOTTED_LINE'],
      required: true,
    },
    effectiveStartDate: { type: Date, required: true, default: Date.now },
    effectiveEndDate: { type: Date },
    isPrimary: { type: Boolean, default: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

ReportingRelationshipSchema.index({ organizationId: 1, employeeId: 1, relationshipType: 1 });

export const ReportingRelationship: Model<IReportingRelationship> =
  mongoose.models.ReportingRelationship ||
  mongoose.model<IReportingRelationship>('ReportingRelationship', ReportingRelationshipSchema);

// ==================== APPROVAL DELEGATIONS ====================
export interface IApprovalDelegation extends Document {
  organizationId: mongoose.Types.ObjectId;
  delegatorEmployeeId: mongoose.Types.ObjectId;
  delegateeEmployeeId: mongoose.Types.ObjectId;
  modules: string[]; // e.g. ['LEAVE', 'TIMESHEET', 'EXPENSE', 'BUDGET']
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalDelegationSchema = new Schema<IApprovalDelegation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    delegatorEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    delegateeEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
    modules: [{ type: String, default: 'LEAVE' }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'REVOKED'], default: 'ACTIVE' },
    reason: { type: String, default: 'Out of office delegation' },
  },
  { timestamps: true }
);

ApprovalDelegationSchema.index({ organizationId: 1, delegatorEmployeeId: 1, status: 1 });

export const ApprovalDelegation: Model<IApprovalDelegation> =
  mongoose.models.ApprovalDelegation ||
  mongoose.model<IApprovalDelegation>('ApprovalDelegation', ApprovalDelegationSchema);
