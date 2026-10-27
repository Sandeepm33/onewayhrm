import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Organization, DEFAULT_SAAS_FEATURES } from '@/models/Organization';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { hashPassword, signJwtToken, getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'PLATFORM_OWNER')) {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Only the Platform Owner can create and provision organizations.' },
        { status: 403 }
      );
    }
    const body = await req.json();
    const {
      companyName,
      companySlug,
      adminName,
      adminEmail,
      password,
      plan = 'PROFESSIONAL',
      currency = 'INR',
      timezone = 'Asia/Kolkata',
    } = body;

    if (!companyName || !adminName || !adminEmail || !password) {
      return NextResponse.json(
        { success: false, error: 'Company Name, Admin Name, Admin Email, and Password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = adminEmail.toLowerCase().trim();
    const slug = (companySlug || companyName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug exists
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      return NextResponse.json(
        { success: false, error: `Organization URL / slug "${slug}" is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `User with email "${cleanEmail}" already exists. Please log in or use a different email.` },
        { status: 409 }
      );
    }

    // 1. Create Organization with dynamic customizable features
    const org = await Organization.create({
      name: companyName.trim(),
      slug,
      contactEmail: cleanEmail,
      currency,
      timezone,
      plan,
      planStatus: 'ACTIVE',
      employeeLimit: plan === 'ENTERPRISE' ? 1000 : plan === 'PROFESSIONAL' ? 250 : 50,
      features: DEFAULT_SAAS_FEATURES,
      statutoryConfig: {
        epfEnabled: true,
        esiEnabled: true,
        ptState: 'Karnataka',
      },
      workWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    });

    // 2. Create Initial Custom Roles for the Organization
    const allModules = DEFAULT_SAAS_FEATURES.map((f) => f.key);
    const ownerPermissions = allModules.map((m) => ({
      module: m,
      actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'] as any,
    }));

    const ownerRole = await Role.create({
      organizationId: org._id,
      name: 'Organization Owner',
      slug: 'owner',
      description: 'Primary tenant administrator with unrestricted access to all features and custom roles',
      isSystemAdmin: true,
      permissions: ownerPermissions,
    });

    // Create a customizable default "Staff Member" role
    await Role.create({
      organizationId: org._id,
      name: 'Staff Member',
      slug: 'staff-member',
      description: 'General organization member with attendance, leave, and self-service capabilities',
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

    // 3. Create Admin User
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email: cleanEmail,
      passwordHash,
      name: adminName.trim(),
      role: 'Organization Owner',
      roleId: ownerRole._id,
      organizationId: org._id,
      isActive: true,
    });

    // 4. Issue JWT Token
    const tokenPayload = {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      roleId: String(ownerRole._id),
      organizationId: String(org._id),
    };

    const token = signJwtToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: 'SaaS Organization created successfully!',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: ownerRole._id,
        organizationId: org._id,
      },
      organization: org,
    });

    // Set auth cookie
    response.cookies.set({
      name: 'hrms_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create organization' },
      { status: 500 }
    );
  }
}
