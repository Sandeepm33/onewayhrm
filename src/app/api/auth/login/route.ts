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

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

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
        { success: false, error: 'Invalid email or password' },
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
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    let organization = null;
    if (user.organizationId) {
      organization = await Organization.findById(user.organizationId);
    }

    let employee = null;
    if (user.employeeId) {
      employee = await Employee.findById(user.employeeId);
    }

    const tokenPayload = {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId ? String(user.organizationId) : '',
      employeeId: user.employeeId ? String(user.employeeId) : undefined,
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
        organizationId: user.organizationId,
        employeeId: user.employeeId,
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
