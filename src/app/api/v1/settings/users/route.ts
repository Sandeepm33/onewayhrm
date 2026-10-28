import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { resolveOrganizationId } from '@/lib/tenant';
import { canUserCustomizeSaas } from '@/lib/permissions';
import { User } from '@/models/User';
import { Employee } from '@/models/Employee';
import { Role } from '@/models/Role';
import { AuditLog } from '@/models/Operations';

/**
 * GET /api/v1/settings/users
 * Lists all organization users along with their role and canCustomizeSaas status.
 * Restricted to Organization Admins, Platform Owners, and users authorized to configure SaaS.
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canCustomize = await canUserCustomizeSaas(session);
    if (!canCustomize) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Organization Admin or SaaS Owner access required' },
        { status: 403 }
      );
    }

    const orgId = await resolveOrganizationId(session);
    const users = await User.find({ organizationId: orgId })
      .select('-passwordHash')
      .populate('roleId', 'name slug isSystemAdmin permissions')
      .populate('employeeId', 'employeeCode firstName lastName departmentId designationId')
      .sort({ createdAt: -1 });

    const roles = await Role.find({ organizationId: orgId }).sort({ name: 1 });

    return NextResponse.json({
      success: true,
      users,
      roles,
    });
  } catch (error: any) {
    console.error('Fetch settings users error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/settings/users
 * Allows Organization Admin to decide:
 * 1. Which specific user has the feature to customize SaaS (canCustomizeSaas: true / false)
 * 2. Which role is assigned to that user
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canCustomize = await canUserCustomizeSaas(session);
    if (!canCustomize) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Organization Admin access required to delegate SaaS customization privileges' },
        { status: 403 }
      );
    }

    const orgId = await resolveOrganizationId(session);
    const body = await req.json();
    const { userId, canCustomizeSaas: toggleCustomSaas, roleId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const targetUser = await User.findOne({ _id: userId, organizationId: orgId });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found in this organization' }, { status: 404 });
    }

    const updates: any = {};
    if (toggleCustomSaas !== undefined) {
      updates.canCustomizeSaas = Boolean(toggleCustomSaas);
      targetUser.canCustomizeSaas = Boolean(toggleCustomSaas);
    }

    if (roleId) {
      const roleDoc = await Role.findOne({ _id: roleId, organizationId: orgId });
      if (roleDoc) {
        updates.roleId = roleDoc._id;
        updates.role = roleDoc.name;
        targetUser.roleId = roleDoc._id as any;
        targetUser.role = roleDoc.name;

        // Also update linked Employee if any
        if (targetUser.employeeId) {
          await Employee.findByIdAndUpdate(targetUser.employeeId, {
            roleId: roleDoc._id,
          });
        }
      }
    }

    await targetUser.save();

    await AuditLog.create({
      organizationId: orgId,
      userId: session.userId,
      userName: session.name,
      action: 'USER_SAAS_PERMISSIONS_UPDATED',
      entityType: 'User',
      entityId: String(targetUser._id),
      details: {
        targetUserEmail: targetUser.email,
        canCustomizeSaas: targetUser.canCustomizeSaas,
        role: targetUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Updated privileges for ${targetUser.name} successfully.`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        roleId: targetUser.roleId,
        canCustomizeSaas: targetUser.canCustomizeSaas,
      },
    });
  } catch (error: any) {
    console.error('Update user settings error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
