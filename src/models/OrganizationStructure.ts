import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBranch extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  isHeadquarters: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'India' },
    isHeadquarters: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BranchSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Branch: Model<IBranch> =
  mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);

export interface IDepartment extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  parentDepartmentId?: mongoose.Types.ObjectId; // For subdepartments
  costCenterCode?: string;
  headEmployeeId?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    parentDepartmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    costCenterCode: { type: String, default: '' },
    headEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

DepartmentSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Department: Model<IDepartment> =
  mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);

export interface IDesignation extends Document {
  organizationId: mongoose.Types.ObjectId;
  departmentId?: mongoose.Types.ObjectId;
  title: string;
  code: string;
  grade?: string; // e.g. L1, L2, L3, Manager, Director
  createdAt: Date;
  updatedAt: Date;
}

const DesignationSchema = new Schema<IDesignation>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    title: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    grade: { type: String, default: 'L1' },
  },
  { timestamps: true }
);

DesignationSchema.index({ organizationId: 1, code: 1 }, { unique: true });

export const Designation: Model<IDesignation> =
  mongoose.models.Designation || mongoose.model<IDesignation>('Designation', DesignationSchema);
