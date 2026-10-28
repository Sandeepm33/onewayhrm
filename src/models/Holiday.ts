import mongoose, { Schema, Document, Model } from 'mongoose';

export type HolidayType = 'NATIONAL' | 'GAZETTED' | 'RESTRICTED' | 'OPTIONAL' | 'COMPANY';

export interface IHoliday extends Document {
  organizationId?: mongoose.Types.ObjectId;
  name: string;
  date: string; // YYYY-MM-DD
  type: HolidayType;
  description?: string;
  isMandatory: boolean;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

const HolidaySchema = new Schema<IHoliday>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
    name: { type: String, required: true },
    date: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['NATIONAL', 'GAZETTED', 'RESTRICTED', 'OPTIONAL', 'COMPANY'],
      default: 'GAZETTED',
    },
    description: { type: String },
    isMandatory: { type: Boolean, default: true },
    year: { type: Number, required: true, index: true },
  },
  { timestamps: true }
);

HolidaySchema.index({ organizationId: 1, date: 1 }, { unique: false });

export const Holiday: Model<IHoliday> =
  mongoose.models.Holiday || mongoose.model<IHoliday>('Holiday', HolidaySchema);
