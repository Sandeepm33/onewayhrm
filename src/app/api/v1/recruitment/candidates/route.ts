import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Candidate, JobRequisition } from '@/models/Recruitment';
import { AuditLog } from '@/models/Operations';
import { resolveOrganizationId } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const stage = searchParams.get('stage');

    const query: any = { organizationId: orgId };
    if (jobId) query.jobId = jobId;
    if (stage) query.stage = stage;

    const candidates = await Candidate.find(query)
      .populate('jobId', 'title jobType')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, candidates });
  } catch (error: any) {
    console.error('Fetch candidates error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const body = await req.json();
    const {
      jobId,
      firstName,
      lastName,
      email,
      phone,
      currentCompany,
      currentCtc,
      expectedCtc,
      noticePeriodDays,
      source,
      stage,
    } = body;

    if (!jobId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'Job ID, first name, last name, and email are required' },
        { status: 400 }
      );
    }

    const candidate = await Candidate.create({
      organizationId: orgId,
      jobId,
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      currentCompany,
      currentCtc: Number(currentCtc) || undefined,
      expectedCtc: Number(expectedCtc) || undefined,
      noticePeriodDays: Number(noticePeriodDays) || 30,
      source: source || 'CAREERS_PAGE',
      stage: stage || 'APPLIED',
    });

    return NextResponse.json({ success: true, candidate });
  } catch (error: any) {
    console.error('Create candidate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { candidateId, stage, rating, offerDetails, interviewNote } = await req.json();

    const candidate = await Candidate.findOne({
      _id: candidateId,
      organizationId: orgId,
    });

    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    if (stage) candidate.stage = stage;
    if (rating !== undefined) candidate.rating = rating;
    if (offerDetails) candidate.offerDetails = { ...candidate.offerDetails, ...offerDetails };

    if (interviewNote) {
      candidate.interviewNotes = candidate.interviewNotes || [];
      candidate.interviewNotes.push({
        ...interviewNote,
        date: new Date(),
      });
    }

    await candidate.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: 'CANDIDATE_STAGE_UPDATED',
      entityType: 'Candidate',
      entityId: String(candidate._id),
      details: { stage, candidateName: `${candidate.firstName} ${candidate.lastName}` },
    });

    return NextResponse.json({ success: true, candidate });
  } catch (error: any) {
    console.error('Update candidate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
