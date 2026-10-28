import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Organization } from '@/models/Organization';
import { Employee } from '@/models/Employee';
import { comparePassword, signJwtToken, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const rawIdentifier = String(email).trim();
    const cleanEmail = rawIdentifier.toLowerCase();
    const upperCode = rawIdentifier.toUpperCase();

    // 1. Try finding user directly by email
    let user = await User.findOne({ email: cleanEmail });

    // 2. If not found by email, try finding employee by employeeCode or email
    let employeeDoc = null;
    if (!user) {
      employeeDoc = await Employee.findOne({
        $or: [{ email: cleanEmail }, { employeeCode: upperCode }],
      });

      if (employeeDoc) {
        if (employeeDoc.userId) {
          user = await User.findById(employeeDoc.userId);
        }
        if (!user && employeeDoc.email) {
          user = await User.findOne({ email: employeeDoc.email.toLowerCase() });
        }

        // If employee exists but has no User account yet, allow sign-in with default password 'Welcome@123'
        if (!user && password === 'Welcome@123') {
          const passwordHash = await hashPassword('Welcome@123');
          user = await User.create({
            organizationId: employeeDoc.organizationId,
            employeeId: employeeDoc._id,
            email: employeeDoc.email.toLowerCase(),
            name: `${employeeDoc.firstName} ${employeeDoc.lastName}`,
            passwordHash,
            role: 'EMPLOYEE',
            isActive: true,
          });
          employeeDoc.userId = user._id as any;
          await employeeDoc.save();
        }
      }
    }

    // Auto-seed Platform Owner if missing or database was purged
    if (!user && cleanEmail === 'owner@onewayhr.com' && password === 'Owner@12345') {
      const passwordHash = await hashPassword('Owner@12345');
      user = await User.create({
        email: 'owner@onewayhr.com',
        name: 'OneWayHR Platform Owner',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/employee ID or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account has been deactivated. Please contact your administrator.' },
        { status: 403 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email/employee ID or password' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId);
    }
    if (!employee && user.email) {
      employee = await Employee.findOne({ email: cleanEmail });
      if (employee) {
        user.employeeId = employee._id as any;
      }
    }

    let orgId = user.organizationId ? String(user.organizationId) : '';
    if (!orgId && employee?.organizationId) {
      orgId = String(employee.organizationId);
      user.organizationId = employee.organizationId as any;
    }

    if (user.isModified('employeeId') || user.isModified('organizationId')) {
      await user.save();
    }

    let organization = null;
    if (orgId) {
      organization = await Organization.findById(orgId);
    }

    const tokenPayload = {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: orgId,
      employeeId: employee ? String(employee._id) : (user.employeeId ? String(user.employeeId) : undefined),
      canCustomizeSaas: Boolean(user.canCustomizeSaas),
    };

    const token = signJwtToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: orgId,
        employeeId: employee ? employee._id : user.employeeId,
        canCustomizeSaas: Boolean(user.canCustomizeSaas),
      },
      organization,
      employee,
    });

    // Set secure cookie
    response.cookies.set({
      name: 'hrms_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
