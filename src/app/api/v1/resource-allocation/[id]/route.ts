import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { resolveOrganizationId } from '@/lib/tenant';
import { ProjectAllocation } from '@/models/ResourceAllocation';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization context required' }, { status: 400 });
    }

    const { id } = await params;
    const body = await req.json();

    const allocation = await ProjectAllocation.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      { $set: body },
      { new: true }
    );

    if (!allocation) {
      return NextResponse.json({ success: false, error: 'Allocation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, allocation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization context required' }, { status: 400 });
    }

    const { id } = await params;
    const allocation = await ProjectAllocation.findOneAndDelete({
      _id: id,
      organizationId: orgId,
    });

    if (!allocation) {
      return NextResponse.json({ success: false, error: 'Allocation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Allocation removed successfully.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
