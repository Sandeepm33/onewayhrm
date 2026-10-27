import mongoose, { Schema, Document, Model } from 'mongoose';
import { IOrgFeature, DEFAULT_SAAS_FEATURES } from '@/config/features';

export { type IOrgFeature, DEFAULT_SAAS_FEATURES };

export interface IOrganization extends Document {
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  contactEmail: string;
  contactPhone?: string;
  currency: string;
  timezone: string;
  plan: 'TRIAL' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  planStatus: 'ACTIVE' | 'TRIALING' | 'SUSPENDED' | 'EXPIRED';
  planExpiresAt?: Date;
  employeeLimit: number;
  features: IOrgFeature[];
  statutoryConfig: {
    epfEnabled: boolean;
    epfNumber?: string;
    esiEnabled: boolean;
    esiNumber?: string;
    panNumber?: string;
    tanNumber?: string;
    gstNumber?: string;
    ptState?: string;
  };
  workWeek: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OrgFeatureSchema = new Schema<IOrgFeature>(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    href: { type: String, required: true },
    icon: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    description: String,
    category: { type: String, enum: ['CORE', 'OPERATIONS', 'FINANCE', 'SYSTEM'], default: 'CORE' },
  },
  { _id: false }
);

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    website: { type: String },
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    contactEmail: { type: String, required: true, trim: true },
    contactPhone: { type: String },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    plan: {
      type: String,
      enum: ['TRIAL', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
      default: 'PROFESSIONAL',
    },
    planStatus: {
      type: String,
      enum: ['ACTIVE', 'TRIALING', 'SUSPENDED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    planExpiresAt: { type: Date },
    employeeLimit: { type: Number, default: 200 },
    features: {
      type: [OrgFeatureSchema],
      default: () => DEFAULT_SAAS_FEATURES,
    },
    statutoryConfig: {
      epfEnabled: { type: Boolean, default: true },
      epfNumber: String,
      esiEnabled: { type: Boolean, default: true },
      esiNumber: String,
      panNumber: String,
      tanNumber: String,
      gstNumber: String,
      ptState: { type: String, default: 'Karnataka' },
    },
    workWeek: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
  },
  { timestamps: true }
);

export const Organization: Model<IOrganization> =
  (mongoose.models && mongoose.models.Organization) ||
  mongoose.model<IOrganization>('Organization', OrganizationSchema);
