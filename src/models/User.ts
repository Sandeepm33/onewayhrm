import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = string;

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: string;
  roleId?: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  employeeId?: mongoose.Types.ObjectId;
  isActive: boolean;
  avatarUrl?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// Compound index for tenant-scoped email uniqueness
UserSchema.index({ email: 1, organizationId: 1 }, { unique: true });

if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
