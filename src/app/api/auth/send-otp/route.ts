import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Employee } from '@/models/Employee';
import { sendPasswordResetOtpEmail } from '@/lib/email';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    let cleanEmail = body.email ? String(body.email).trim().toLowerCase() : '';

    let user = null;
    if (cleanEmail) {
      user = await User.findOne({ email: cleanEmail });
      if (!user) {
        // Try looking up by employee code
        const emp = await Employee.findOne({
          $or: [{ employeeCode: String(body.email).trim().toUpperCase() }, { email: cleanEmail }],
        });
        if (emp?.userId) {
          user = await User.findById(emp.userId);
        } else if (emp?.email) {
          user = await User.findOne({ email: emp.email.toLowerCase() });
        }
      }
    }

    if (!user) {
      const session = getSessionFromRequest(req);
      if (session?.userId) {
        user = await User.findById(session.userId);
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user account found matching this email address or Employee ID.' },
        { status: 404 }
      );
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send 6-digit OTP email
    const emailResult = await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      isFirstTime: Boolean(user.mustChangePassword),
    });

    if (!emailResult.success) {
      console.warn('[Send OTP Warning]:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}.`,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

