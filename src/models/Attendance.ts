import mongoose, { Schema, Document, Model } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEK_OFF';
export type WorkLocation = 'OFFICE' | 'REMOTE' | 'FIELD';

export interface IAttendance extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkIn?: Date;
  checkOut?: Date;
  workHoursMinutes: number; // e.g. 480 mins = 8 hours
  status: AttendanceStatus;
  workLocation: WorkLocation;
  checkInCoordinates?: {
    latitude: number;
    longitude: number;
  };
  checkOutCoordinates?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  regularization?: {
    requested: boolean;
    reason?: string;
    requestedCheckIn?: Date;
    requestedCheckOut?: Date;
    status: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    reviewerRemarks?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    checkIn: { type: Date },
    checkOut: { type: Date },
    workHoursMinutes: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF'],
      default: 'PRESENT',
    },
    workLocation: {
      type: String,
      enum: ['OFFICE', 'REMOTE', 'FIELD'],
      default: 'OFFICE',
    },
    checkInCoordinates: {
      latitude: Number,
      longitude: Number,
    },
    checkOutCoordinates: {
      latitude: Number,
      longitude: Number,
    },
    notes: String,
    regularization: {
      requested: { type: Boolean, default: false },
      reason: String,
      requestedCheckIn: Date,
      requestedCheckOut: Date,
      status: {
        type: String,
        enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'],
        default: 'NONE',
      },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      reviewerRemarks: String,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ organizationId: 1, employeeId: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
