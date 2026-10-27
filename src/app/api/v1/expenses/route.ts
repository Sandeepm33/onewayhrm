import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { ExpenseClaim } from '@/models/Operations';

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

    const expenses = await ExpenseClaim.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    console.error('Fetch expenses error:', error);
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

    const { category, amount, expenseDate, description, receiptUrl } = await req.json();

    const targetEmployeeId = session.employeeId;
    if (!targetEmployeeId) {
      return NextResponse.json({ success: false, error: 'Employee record required' }, { status: 400 });
    }

    const count = await ExpenseClaim.countDocuments({ organizationId: session.organizationId });
    const claimNumber = `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const claim = await ExpenseClaim.create({
      organizationId: session.organizationId,
      employeeId: targetEmployeeId,
      claimNumber,
      category,
      amount: Number(amount),
      expenseDate,
      description,
      receiptUrl,
      status: 'PENDING',
    });

    return NextResponse.json({ success: true, claim });
  } catch (error: any) {
    console.error('Create expense error:', error);
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

    const { claimId, status } = await req.json();

    const claim = await ExpenseClaim.findOneAndUpdate(
      { _id: claimId, organizationId: session.organizationId },
      {
        $set: {
          status,
          reviewedBy: session.userId,
          reviewedAt: new Date(),
          reimbursedAt: status === 'REIMBURSED' ? new Date() : undefined,
        },
      },
      { new: true }
    );

    return NextResponse.json({ success: true, claim });
  } catch (error: any) {
    console.error('Update expense error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
