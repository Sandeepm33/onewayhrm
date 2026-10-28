import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { JobRequisition, Candidate } from '@/models/Recruitment';
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
    const status = searchParams.get('status');

    const query: any = { organizationId: orgId };
    if (status) query.status = status;

    const jobs = await JobRequisition.find(query)
      .populate('departmentId', 'name code')
      .populate('branchId', 'name city')
      .populate('hiringManagerId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Attach candidate counts for each job strictly within tenant
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const candidateCount = await Candidate.countDocuments({ jobId: job._id, organizationId: orgId });
        return { ...job.toObject(), candidateCount };
      })
    );

    return NextResponse.json({ success: true, jobs: jobsWithCounts });
  } catch (error: any) {
    console.error('Fetch jobs error:', error);
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
      title,
      departmentId,
      branchId,
      jobType,
      experienceRequired,
      openings,
      salaryMin,
      salaryMax,
      description,
      requirements,
      hiringManagerId,
    } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Title and description are required' }, { status: 400 });
    }

    const job = await JobRequisition.create({
      organizationId: orgId,
      title,
      departmentId: departmentId || undefined,
      branchId: branchId || undefined,
      jobType: jobType || 'FULL_TIME',
      experienceRequired: experienceRequired || '2-5 years',
      openings: Number(openings) || 1,
      salaryMin: Number(salaryMin) || 400000,
      salaryMax: Number(salaryMax) || 1000000,
      description,
      requirements: Array.isArray(requirements) ? requirements : (requirements || '').split(',').map((s: string) => s.trim()),
      status: 'OPEN',
      hiringManagerId: hiringManagerId || undefined,
    });

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: 'JOB_REQUISITION_CREATED',
      entityType: 'JobRequisition',
      entityId: String(job._id),
      details: { title, openings },
    });

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error('Create job error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
