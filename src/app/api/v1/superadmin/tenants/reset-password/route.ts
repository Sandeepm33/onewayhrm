import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { Organization } from '@/models/Organization';
import { User } from '@/models/User';
import { AuditLog } from '@/models/Operations';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_OWNER')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Platform Owner can reset tenant credentials' },
        { status: 403 }
      );
    }

    const { organizationId, newPassword } = await req.json();

    if (!organizationId || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Organization ID and new password are required' },
        { status: 400 }
      );
    }

    const org = await Organization.findById(organizationId);
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    // Find the primary admin user for this organization
    const adminUser = await User.findOne({
      organizationId: org._id,
      $or: [{ role: 'Organization Admin' }, { role: 'ORG_ADMIN' }, { email: org.contactEmail }],
    });

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: `No admin user account found for organization "${org.name}"` },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(newPassword);
    adminUser.passwordHash = passwordHash;
    adminUser.isActive = true;
    await adminUser.save();

    await AuditLog.create({
      userId: session.userId as any,
      userName: session.name,
      action: 'TENANT_ADMIN_PASSWORD_RESET_BY_PLATFORM_OWNER',
      entityType: 'User',
      entityId: String(adminUser._id),
      details: { organizationId: String(org._id), adminEmail: adminUser.email },
    });

    return NextResponse.json({
      success: true,
      message: `Password for "${adminUser.name}" (${adminUser.email}) reset successfully.`,
      email: adminUser.email,
      organizationName: org.name,
    });
  } catch (error: any) {
    console.error('Reset tenant password error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
