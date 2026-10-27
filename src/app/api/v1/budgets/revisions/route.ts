import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Budget, BudgetRevision } from '@/models/Budget';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { budgetId, requestedAmount, reason } = body;

    if (!budgetId || !requestedAmount || !reason) {
      return NextResponse.json(
        { success: false, error: 'Budget ID, requested amount, and reason are required.' },
        { status: 400 }
      );
    }

    const budget = await Budget.findOne({ _id: budgetId, organizationId: session.organizationId });
    if (!budget) {
      return NextResponse.json({ success: false, error: 'Budget not found' }, { status: 404 });
    }

    const revisionCount = await BudgetRevision.countDocuments({ budgetId });
    const previousAmount = budget.approvedAmount;
    const difference = Number(requestedAmount) - previousAmount;

    const revision = await BudgetRevision.create({
      organizationId: session.organizationId,
      budgetId,
      revisionNumber: revisionCount + 1,
      previousAmount,
      requestedAmount: Number(requestedAmount),
      difference,
      reason,
      requestedByUserId: session.userId,
      status: 'PENDING',
    });

    return NextResponse.json({
      success: true,
      message: 'Budget revision request submitted for Finance approval.',
      revision,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { revisionId, action, comments } = body; // action: 'APPROVED' | 'REJECTED'

    const revision = await BudgetRevision.findOne({ _id: revisionId, organizationId: session.organizationId });
    if (!revision) {
      return NextResponse.json({ success: false, error: 'Revision request not found' }, { status: 404 });
    }

    revision.status = action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    revision.reviewedByUserId = session.userId as any;
    revision.reviewedAt = new Date();
    revision.comments = comments || '';
    await revision.save();

    if (action === 'APPROVED') {
      await Budget.findByIdAndUpdate(revision.budgetId, {
        approvedAmount: revision.requestedAmount,
        status: 'REVISED',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Budget revision ${action.toLowerCase()} successfully.`,
      revision,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
