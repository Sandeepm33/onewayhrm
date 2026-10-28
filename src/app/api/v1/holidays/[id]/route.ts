import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Holiday } from '@/models/Holiday';
import { resolveOrganizationId } from '@/lib/tenant';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const orgId = await resolveOrganizationId(session);
    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.date) {
      updateData.date = body.date;
      updateData.year = parseInt(body.date.split('-')[0], 10);
    }
    if (body.type) updateData.type = body.type;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isMandatory !== undefined) updateData.isMandatory = body.isMandatory;

    const holiday = await Holiday.findOneAndUpdate(
      {
        _id: id,
        $or: [{ organizationId: orgId }, { organizationId: null }, { organizationId: { $exists: false } }],
      },
      { $set: updateData },
      { new: true }
    );

    if (!holiday) {
      return NextResponse.json({ success: false, error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, holiday, message: 'Holiday updated successfully' });
  } catch (error: any) {
    console.error('Update holiday error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_ADMIN', 'MANAGER'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const orgId = await resolveOrganizationId(session);
    const { id } = await params;

    const holiday = await Holiday.findOneAndDelete({
      _id: id,
      $or: [{ organizationId: orgId }, { organizationId: null }, { organizationId: { $exists: false } }],
    });

    if (!holiday) {
      return NextResponse.json({ success: false, error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error: any) {
    console.error('Delete holiday error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
