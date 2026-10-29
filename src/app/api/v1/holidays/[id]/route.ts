import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Holiday } from '@/models/Holiday';
import { resolveOrganizationId } from '@/lib/tenant';

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

    const orgId = await resolveOrganizationId(session);
    const { id } = await params;

    const deleted = await Holiday.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Holiday not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Holiday "${deleted.name}" removed successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
