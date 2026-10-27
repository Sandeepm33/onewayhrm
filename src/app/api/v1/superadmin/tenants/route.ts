import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { Organization } from '@/models/Organization';
import { DEFAULT_SAAS_FEATURES } from '@/config/features';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { Employee } from '@/models/Employee';
import { AuditLog } from '@/models/Operations';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_OWNER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Platform Owner / Super Admin access required' }, { status: 403 });
    }

    const organizations = await Organization.find().sort({ createdAt: -1 });

    const orgsWithMetrics = await Promise.all(
      organizations.map(async (org) => {
        const employeeCount = await Employee.countDocuments({ organizationId: org._id });
        const userCount = await User.countDocuments({ organizationId: org._id });
        const rolesCount = await Role.countDocuments({ organizationId: org._id });
        return {
          ...org.toObject(),
          employeeCount,
          userCount,
          rolesCount,
        };
      })
    );

    return NextResponse.json({ success: true, organizations: orgsWithMetrics });
  } catch (error: any) {
    console.error('Superadmin tenants error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_OWNER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only the Platform Owner can add organizations.' }, { status: 403 });
    }

    const { name, slug, contactEmail, contactPhone, plan, employeeLimit, adminName, adminPassword } = await req.json();

    if (!name || !slug || !contactEmail) {
      return NextResponse.json({ success: false, error: 'Name, slug, and contact email are required' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const existingSlug = await Organization.findOne({ slug: cleanSlug });
    if (existingSlug) {
      return NextResponse.json({ success: false, error: 'An organization with this slug already exists' }, { status: 400 });
    }

    // 1. Create Organization with default customizable features
    const org = await Organization.create({
      name: name.trim(),
      slug: cleanSlug,
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone,
      plan: plan || 'PROFESSIONAL',
      planStatus: 'ACTIVE',
      employeeLimit: Number(employeeLimit) || 200,
      features: DEFAULT_SAAS_FEATURES,
      statutoryConfig: {
        epfEnabled: true,
        esiEnabled: true,
        ptState: 'Karnataka',
      },
      workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    });

    // 2. Initialize default dynamic custom roles for this organization
    const allModules = DEFAULT_SAAS_FEATURES.map((f) => f.key);
    const ownerPermissions = allModules.map((m) => ({
      module: m,
      actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] as any,
    }));

    const ownerRole = await Role.create({
      organizationId: org._id,
      name: 'Organization Admin',
      slug: 'admin',
      description: 'Primary administrator with full access to this organization',
      isSystemAdmin: true,
      permissions: ownerPermissions,
    });

    await Role.create({
      organizationId: org._id,
      name: 'Staff Member',
      slug: 'member',
      description: 'Regular organization member with attendance, leaves, and self-service capabilities',
      isSystemAdmin: false,
      permissions: [
        { module: 'dashboard', actions: ['view'] },
        { module: 'attendance', actions: ['view', 'create'] },
        { module: 'leave', actions: ['view', 'create'] },
        { module: 'payslips', actions: ['view'] },
        { module: 'self-service', actions: ['view', 'create', 'edit'] },
        { module: 'helpdesk', actions: ['view', 'create'] },
      ],
    });

    // 3. Create Tenant Admin User
    let adminUser = null;
    if (adminName && adminPassword) {
      const passwordHash = await hashPassword(adminPassword);
      adminUser = await User.create({
        organizationId: org._id,
        name: adminName.trim(),
        email: contactEmail.toLowerCase().trim(),
        passwordHash,
        role: 'Organization Admin',
        roleId: ownerRole._id,
        isActive: true,
      });
    }

    await AuditLog.create({
      userId: session.userId as any,
      userName: session.name,
      action: 'ORGANIZATION_PROVISIONED_BY_PLATFORM_OWNER',
      entityType: 'Organization',
      entityId: String(org._id),
      details: { name: org.name, slug: org.slug, plan: org.plan, adminEmail: contactEmail },
    });

    return NextResponse.json({
      success: true,
      message: `Organization "${org.name}" provisioned successfully by Platform Owner.`,
      organization: org,
      adminUser: adminUser ? { name: adminUser.name, email: adminUser.email } : null,
    });
  } catch (error: any) {
    console.error('Create tenant error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_OWNER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { organizationId, plan, planStatus, employeeLimit } = await req.json();

    const updates: any = {};
    if (plan) updates.plan = plan;
    if (planStatus) updates.planStatus = planStatus;
    if (employeeLimit !== undefined) updates.employeeLimit = Number(employeeLimit);

    const org = await Organization.findByIdAndUpdate(organizationId, { $set: updates }, { new: true });

    return NextResponse.json({ success: true, organization: org });
  } catch (error: any) {
    console.error('Update tenant error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
