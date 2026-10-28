import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Goal } from '@/models/Operations';
import { resolveOrganizationId, resolveEmployeeForSession } from '@/lib/tenant';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const query: any = { organizationId: orgId };
    if (session.role === 'EMPLOYEE') {
      const emp = await resolveEmployeeForSession(session, undefined, orgId);
      if (emp) {
        query.employeeId = emp._id;
      }
    }

    const goals = await Goal.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, goals });
  } catch (error: any) {
    console.error('Fetch goals error:', error);
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
    const { employeeId, title, description, category, targetDate, weightage } = await req.json();

    const emp = await resolveEmployeeForSession(session, employeeId, orgId);
    if (!emp) {
      return NextResponse.json({ success: false, error: 'Employee record required' }, { status: 400 });
    }

    const goal = await Goal.create({
      organizationId: orgId,
      employeeId: emp._id,
      title,
      description,
      category: category || 'INDIVIDUAL',
      targetDate,
      weightage: Number(weightage) || 20,
      progressPercentage: 0,
      status: 'IN_PROGRESS',
    });

    return NextResponse.json({ success: true, goal });
  } catch (error: any) {
    console.error('Create goal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { goalId, progressPercentage, status, managerRating, managerFeedback } = await req.json();

    const updates: any = {};
    if (progressPercentage !== undefined) updates.progressPercentage = Number(progressPercentage);
    if (status) updates.status = status;
    if (managerRating !== undefined) updates.managerRating = Number(managerRating);
    if (managerFeedback) updates.managerFeedback = managerFeedback;

    const goal = await Goal.findOneAndUpdate(
      { _id: goalId, organizationId: orgId },
      { $set: updates },
      { new: true }
    );

    return NextResponse.json({ success: true, goal });
  } catch (error: any) {
    console.error('Update goal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
