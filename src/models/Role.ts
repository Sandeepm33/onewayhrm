import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRolePermission {
  module: string; // e.g. 'dashboard', 'employees', 'attendance', 'leave', 'payroll', 'payslips', 'recruitment', 'documents', 'timesheets', 'expenses', 'performance', 'assets', 'helpdesk', 'reports', 'settings', 'roles'
  actions: ('view' | 'create' | 'edit' | 'delete' | 'approve' | 'export')[];
}

export interface IRole extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  isSystemAdmin: boolean;
  permissions: IRolePermission[];
  createdAt: Date;
  updatedAt: Date;
}

const RolePermissionSchema = new Schema<IRolePermission>(
  {
    module: { type: String, required: true },
    actions: [{ type: String, enum: ['view', 'create', 'edit', 'delete', 'approve', 'export'] }],
  },
  { _id: false }
);

const RoleSchema = new Schema<IRole>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isSystemAdmin: { type: Boolean, default: false },
    permissions: [RolePermissionSchema],
  },
  { timestamps: true }
);

RoleSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

export const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
