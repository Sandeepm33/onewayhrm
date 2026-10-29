import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Organization } from '@/models/Organization';
import { Employee } from '@/models/Employee';
import { hashPassword, signJwtToken, getSessionFromRequest, comparePassword } from '@/lib/auth';
import { sendPasswordChangedEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { token, newPassword, oldPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    let user = null;

    // Flow A: Reset using email token
    if (token) {
      user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Password reset link is invalid or has expired. Please request a new one.' },
          { status: 400 }
        );
      }
    } else {
      // Flow B: Reset using active session (e.g. forced first-time reset or authenticated user)
      const session = getSessionFromRequest(req);
      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Session or reset token required' },
          { status: 401 }
        );
      }

      user = await User.findById(session.userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      // If user had mustChangePassword === false, require oldPassword check
      if (!user.mustChangePassword && oldPassword) {
        const isValid = await comparePassword(oldPassword, user.passwordHash);
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: 'Current password is incorrect' },
            { status: 400 }
          );
        }
      }
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.mustChangePassword = false;
    await user.save();

    // Send confirmation email
    sendPasswordChangedEmail({
      to: user.email,
      name: user.name,
    }).catch((err) => console.error('[Reset Password] Email send notification failed:', err));

    // Sign new JWT token so user is automatically authenticated
    const org = user.organizationId ? await Organization.findById(user.organizationId) : null;
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
      employeeId: employee ? String(employee._id) : undefined,
      canCustomizeSaas: Boolean(user.canCustomizeSaas),
    };

    const authToken = signJwtToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Your permanent password has been set successfully!',
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        mustChangePassword: false,
      },
      organization: org,
    });

    response.cookies.set({
      name: 'hrms_token',
      value: authToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
