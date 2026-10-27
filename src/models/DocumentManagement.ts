import mongoose, { Schema, Document, Model } from 'mongoose';

export type DocumentType =
  | 'OFFER_LETTER'
  | 'APPOINTMENT_LETTER'
  | 'RELIEVING_LETTER'
  | 'EXPERIENCE_LETTER'
  | 'PROMOTION_LETTER'
  | 'NOC';

export interface IDocumentTemplate extends Document {
  organizationId: mongoose.Types.ObjectId;
  type: DocumentType;
  title: string;
  templateBody: string; // Markdown / HTML with placeholders like {{employeeName}}, {{ctc}}, {{designation}}
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentTemplateSchema = new Schema<IDocumentTemplate>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: {
      type: String,
      enum: [
        'OFFER_LETTER',
        'APPOINTMENT_LETTER',
        'RELIEVING_LETTER',
        'EXPERIENCE_LETTER',
        'PROMOTION_LETTER',
        'NOC',
      ],
      required: true,
    },
    title: { type: String, required: true },
    templateBody: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const DocumentTemplate: Model<IDocumentTemplate> =
  mongoose.models.DocumentTemplate ||
  mongoose.model<IDocumentTemplate>('DocumentTemplate', DocumentTemplateSchema);

export interface IIssuedDocument extends Document {
  organizationId: mongoose.Types.ObjectId;
  documentType: DocumentType;
  documentNumber: string; // e.g. DOC-OFFER-2026-001
  employeeId?: mongoose.Types.ObjectId;
  candidateId?: mongoose.Types.ObjectId;
  recipientName: string;
  recipientEmail: string;
  title: string;
  content: string; // Rendered final content
  pdfDataUrl?: string;
  status: 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REVOKED';
  issuedBy?: mongoose.Types.ObjectId;
  issuedAt?: Date;
  acceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IssuedDocumentSchema = new Schema<IIssuedDocument>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    documentType: {
      type: String,
      enum: [
        'OFFER_LETTER',
        'APPOINTMENT_LETTER',
        'RELIEVING_LETTER',
        'EXPERIENCE_LETTER',
        'PROMOTION_LETTER',
        'NOC',
      ],
      required: true,
    },
    documentNumber: { type: String, required: true, unique: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate' },
    recipientName: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    pdfDataUrl: String,
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'ACCEPTED', 'REVOKED'],
      default: 'ISSUED',
    },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    issuedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
  },
  { timestamps: true }
);

export const IssuedDocument: Model<IIssuedDocument> =
  mongoose.models.IssuedDocument ||
  mongoose.model<IIssuedDocument>('IssuedDocument', IssuedDocumentSchema);
