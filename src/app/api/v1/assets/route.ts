import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Asset } from '@/models/Operations';
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
        query.assignedToEmployeeId = emp._id;
      }
    }

    const assets = await Asset.find(query)
      .populate('assignedToEmployeeId', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error('Fetch assets error:', error);
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
    const { name, category, serialNumber, purchaseDate, purchaseCost, assignedToEmployeeId } = await req.json();

    const count = await Asset.countDocuments({ organizationId: orgId });
    const assetCode = `AST-${category?.substring(0, 3) || 'GEN'}-${String(count + 1).padStart(3, '0')}`;

    const asset = await Asset.create({
      organizationId: orgId,
      name,
      assetCode,
      category,
      serialNumber,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      purchaseCost: Number(purchaseCost) || 0,
      status: assignedToEmployeeId ? 'ASSIGNED' : 'AVAILABLE',
      assignedToEmployeeId: assignedToEmployeeId || undefined,
      assignedAt: assignedToEmployeeId ? new Date() : undefined,
    });

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Create asset error:', error);
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
    const { assetId, assignedToEmployeeId, status, returnCondition } = await req.json();

    const updates: any = {};
    if (status) updates.status = status;
    if (assignedToEmployeeId !== undefined) {
      updates.assignedToEmployeeId = assignedToEmployeeId || null;
      updates.assignedAt = assignedToEmployeeId ? new Date() : null;
      updates.status = assignedToEmployeeId ? 'ASSIGNED' : 'AVAILABLE';
    }
    if (returnCondition) updates.returnCondition = returnCondition;

    const asset = await Asset.findOneAndUpdate(
      { _id: assetId, organizationId: orgId },
      { $set: updates },
      { new: true }
    );

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Update asset error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
