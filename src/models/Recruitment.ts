import mongoose, { Schema, Document, Model } from 'mongoose';

export type JobStatus = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED';
export type CandidateStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'SELECTED'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED';

export interface IJobRequisition extends Document {
  organizationId: mongoose.Types.ObjectId;
  title: string;
  departmentId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  jobType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  experienceRequired: string; // e.g. "3-5 years"
  openings: number;
  salaryMin: number;
  salaryMax: number;
  description: string;
  requirements: string[];
  status: JobStatus;
  hiringManagerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobRequisitionSchema = new Schema<IJobRequisition>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    jobType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'],
      default: 'FULL_TIME',
    },
    experienceRequired: { type: String, default: '2-4 years' },
    openings: { type: Number, default: 1 },
    salaryMin: { type: Number, default: 400000 },
    salaryMax: { type: Number, default: 900000 },
    description: { type: String, required: true },
    requirements: [String],
    status: {
      type: String,
      enum: ['DRAFT', 'OPEN', 'ON_HOLD', 'CLOSED'],
      default: 'OPEN',
    },
    hiringManagerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

export const JobRequisition: Model<IJobRequisition> =
  mongoose.models.JobRequisition || mongoose.model<IJobRequisition>('JobRequisition', JobRequisitionSchema);

export interface ICandidate extends Document {
  organizationId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentCompany?: string;
  currentCtc?: number;
  expectedCtc?: number;
  noticePeriodDays?: number;
  resumeUrl?: string;
  source: 'LINKEDIN' | 'CAREERS_PAGE' | 'REFERRAL' | 'JOB_BOARD' | 'AGENCY';
  stage: CandidateStage;
  rating?: number; // 1 to 5
  interviewNotes?: {
    round: string;
    interviewerName: string;
    date: Date;
    feedback: string;
    rating: number;
  }[];
  offerDetails?: {
    offeredCtc: number;
    joiningDate: Date;
    offerLetterIssued: boolean;
    status: 'OFFER_MADE' | 'ACCEPTED' | 'DECLINED';
  };
  convertedToEmployeeId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'JobRequisition', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    currentCompany: String,
    currentCtc: Number,
    expectedCtc: Number,
    noticePeriodDays: { type: Number, default: 30 },
    resumeUrl: String,
    source: {
      type: String,
      enum: ['LINKEDIN', 'CAREERS_PAGE', 'REFERRAL', 'JOB_BOARD', 'AGENCY'],
      default: 'CAREERS_PAGE',
    },
    stage: {
      type: String,
      enum: ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'OFFER', 'HIRED', 'REJECTED'],
      default: 'APPLIED',
      index: true,
    },
    rating: { type: Number, default: 4 },
    interviewNotes: [
      {
        round: String,
        interviewerName: String,
        date: Date,
        feedback: String,
        rating: Number,
      },
    ],
    offerDetails: {
      offeredCtc: Number,
      joiningDate: Date,
      offerLetterIssued: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ['OFFER_MADE', 'ACCEPTED', 'DECLINED'],
      },
    },
    convertedToEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  },
  { timestamps: true }
);

export const Candidate: Model<ICandidate> =
  mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);
