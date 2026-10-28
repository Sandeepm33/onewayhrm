import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Role } from '@/models/Role';
import { User } from '@/models/User';
import { resolveOrganizationId } from '@/lib/tenant';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { id } = await params;
    const body = await req.json();
    const { name, description, isSystemAdmin, permissions } = body;

    const role = await Role.findOne({ _id: id, organizationId: orgId });
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    if (name && name.trim()) {
      role.name = name.trim();
      role.slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
    }

    if (description !== undefined) role.description = description;
    if (isSystemAdmin !== undefined) role.isSystemAdmin = Boolean(isSystemAdmin);
    if (permissions !== undefined) role.permissions = permissions;

    await role.save();

    // Also update any users that have this role name cached
    if (name) {
      await User.updateMany({ roleId: role._id, organizationId: orgId }, { role: role.name });
    }

    return NextResponse.json({
      success: true,
      message: `Role "${role.name}" updated successfully.`,
      role,
    });
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
    const { id } = await params;
    const role = await Role.findOne({ _id: id, organizationId: orgId });
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    // Check if this is the only system admin role
    if (role.isSystemAdmin) {
      const adminRolesCount = await Role.countDocuments({
        organizationId: orgId,
        isSystemAdmin: true,
      });
      if (adminRolesCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete the only System Admin role for this organization.' },
          { status: 400 }
        );
      }
    }

    // Check if users are assigned to this role
    const usersWithRole = await User.countDocuments({ roleId: role._id, organizationId: orgId });
    if (usersWithRole > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role "${role.name}" because ${usersWithRole} user(s) are assigned to it. Please reassign them first.`,
        },
        { status: 400 }
      );
    }

    await Role.deleteOne({ _id: id, organizationId: orgId });

    return NextResponse.json({
      success: true,
      message: `Role "${role.name}" deleted successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
