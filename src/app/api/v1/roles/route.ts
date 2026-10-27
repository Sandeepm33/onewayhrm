import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Role } from '@/models/Role';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await Role.find({ organizationId: session.organizationId }).sort({ createdAt: 1 });
    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || !session.organizationId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isSystemAdmin = false, permissions = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Role name is required.' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    // Check if role name already exists in this organization
    const existingRole = await Role.findOne({
      organizationId: session.organizationId,
      $or: [{ name: name.trim() }, { slug }],
    });

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: `A role named "${name}" already exists in your organization.` },
        { status: 409 }
      );
    }

    const newRole = await Role.create({
      organizationId: session.organizationId,
      name: name.trim(),
      slug,
      description: description || '',
      isSystemAdmin: Boolean(isSystemAdmin),
      permissions: permissions || [],
    });

    return NextResponse.json({
      success: true,
      message: `Custom role "${newRole.name}" created successfully.`,
      role: newRole,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
