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
    const body = await req.json();
    const { email, otp, token, newPassword, oldPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    let user = null;

    // Flow 1: 6-Digit OTP Verification (Primary Modern Way)
    if (otp && String(otp).trim()) {
      const cleanOtp = String(otp).trim();
      const cleanEmail = email ? String(email).trim().toLowerCase() : '';

      if (cleanEmail) {
        user = await User.findOne({ email: cleanEmail });
      }

      // If user not found by email, check if authenticated session exists
      if (!user) {
        const session = getSessionFromRequest(req);
        if (session?.userId) {
          user = await User.findById(session.userId);
        }
      }

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User account not found. Please verify your email address.' },
          { status: 404 }
        );
      }

      // Verify OTP and expiration
      if (!user.resetPasswordOtp || user.resetPasswordOtp !== cleanOtp) {
        return NextResponse.json(
          { success: false, error: 'Invalid 6-digit verification code. Please check your email or click "Resend Code".' },
          { status: 400 }
        );
      }

      if (!user.resetPasswordOtpExpires || new Date() > new Date(user.resetPasswordOtpExpires)) {
        return NextResponse.json(
          { success: false, error: 'The 6-digit verification code has expired. Please click "Resend Code" to receive a fresh OTP.' },
          { status: 400 }
        );
      }
    }
    // Flow 2: Legacy Email Link Token
    else if (token) {
      user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Password reset link is invalid or has expired. Please request a new 6-digit code.' },
          { status: 400 }
        );
      }
    }
    // Flow 3: Session-authenticated reset with Old Password
    else {
      const session = getSessionFromRequest(req);
      if (!session) {
        return NextResponse.json(
          { success: false, error: '6-digit verification code or active session is required.' },
          { status: 401 }
        );
      }

      user = await User.findById(session.userId);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }

      // If not forced reset, require oldPassword verification
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

    // Update password & clear all OTP / reset flags
    const passwordHash = await hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
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
