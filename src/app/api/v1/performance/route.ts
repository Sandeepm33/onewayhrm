import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Goal } from '@/models/Operations';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const query: any = { organizationId: session.organizationId };
    if (session.role === 'EMPLOYEE' && session.employeeId) {
      query.employeeId = session.employeeId;
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

    const { employeeId, title, description, category, targetDate, weightage } = await req.json();

    const targetEmp = employeeId || session.employeeId;
    if (!targetEmp) {
      return NextResponse.json({ success: false, error: 'Employee ID required' }, { status: 400 });
    }

    const goal = await Goal.create({
      organizationId: session.organizationId,
      employeeId: targetEmp,
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

    const { goalId, progressPercentage, status, managerRating, managerFeedback } = await req.json();

    const updates: any = {};
    if (progressPercentage !== undefined) updates.progressPercentage = Number(progressPercentage);
    if (status) updates.status = status;
    if (managerRating !== undefined) updates.managerRating = Number(managerRating);
    if (managerFeedback) updates.managerFeedback = managerFeedback;

    const goal = await Goal.findOneAndUpdate(
      { _id: goalId, organizationId: session.organizationId },
      { $set: updates },
      { new: true }
    );

    return NextResponse.json({ success: true, goal });
  } catch (error: any) {
    console.error('Update goal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
