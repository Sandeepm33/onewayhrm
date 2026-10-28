import mongoose, { Schema, Document, Model } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEK_OFF';
export type WorkLocation = 'OFFICE' | 'REMOTE' | 'FIELD';
export type DayClockStatus = 'NOT_CLOCKED_IN' | 'WORKING' | 'ON_BREAK' | 'CLOCKED_OUT';
export type BreakType = 'TEA' | 'LUNCH' | 'SMOKE' | 'MEETING' | 'PERSONAL' | 'GENERAL';

export interface IAttendanceBreak {
  _id?: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  type: BreakType;
  notes?: string;
}

export interface IAttendance extends Document {
  organizationId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  checkIn?: Date;
  checkOut?: Date;
  workHoursMinutes: number; // gross work minutes
  breaks: IAttendanceBreak[];
  totalBreakMinutes: number;
  netWorkHoursMinutes: number; // workHoursMinutes - totalBreakMinutes
  dayStatus: DayClockStatus;
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

const BreakSchema = new Schema<IAttendanceBreak>(
  {
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ['TEA', 'LUNCH', 'SMOKE', 'MEETING', 'PERSONAL', 'GENERAL'],
      default: 'GENERAL',
    },
    notes: { type: String },
  },
  { _id: true }
);

const AttendanceSchema = new Schema<IAttendance>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    checkIn: { type: Date },
    checkOut: { type: Date },
    workHoursMinutes: { type: Number, default: 0 },
    breaks: { type: [BreakSchema], default: [] },
    totalBreakMinutes: { type: Number, default: 0 },
    netWorkHoursMinutes: { type: Number, default: 0 },
    dayStatus: {
      type: String,
      enum: ['NOT_CLOCKED_IN', 'WORKING', 'ON_BREAK', 'CLOCKED_OUT'],
      default: 'NOT_CLOCKED_IN',
    },
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

if (mongoose.models && mongoose.models.Attendance) {
  delete mongoose.models.Attendance;
}

export const Attendance: Model<IAttendance> = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
