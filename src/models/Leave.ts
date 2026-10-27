import mongoose, { Schema, Document, Model } from 'mongoose';

export type LeaveTypeCode = 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ILeaveBalance extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  year: number;
  casualLeave: { total: number; used: number };
  sickLeave: { total: number; used: number };
  earnedLeave: { total: number; used: number };
  unpaidLeave: { used: number };
  createdAt: Date;
  updatedAt: Date;
}

const LeaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    year: { type: Number, required: true },
    casualLeave: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
    },
    sickLeave: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
    },
    earnedLeave: {
      total: { type: Number, default: 15 },
      used: { type: Number, default: 0 },
    },
    unpaidLeave: {
      used: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

LeaveBalanceSchema.index({ organizationId: 1, employeeId: 1, year: 1 }, { unique: true });

export const LeaveBalance: Model<ILeaveBalance> =
  mongoose.models.LeaveBalance || mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);

export interface ILeaveRequest extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  leaveType: LeaveTypeCode;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  isHalfDay: boolean;
  halfDaySession?: 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  status: LeaveRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewerRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    leaveType: {
      type: String,
      enum: ['CASUAL', 'SICK', 'EARNED', 'MATERNITY', 'PATERNITY', 'UNPAID'],
      required: true,
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    totalDays: { type: Number, required: true },
    isHalfDay: { type: Boolean, default: false },
    halfDaySession: { type: String, enum: ['FIRST_HALF', 'SECOND_HALF'] },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewerRemarks: { type: String },
  },
  { timestamps: true }
);

export const LeaveRequest: Model<ILeaveRequest> =
  mongoose.models.LeaveRequest || mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);
