import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { Employee } from '@/models/Employee';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email || !String(email).trim()) {
      return NextResponse.json(
        { success: false, error: 'Email or Employee ID is required' },
        { status: 400 }
      );
    }

    const raw = String(email).trim();
    const cleanEmail = raw.toLowerCase();
    const upperCode = raw.toUpperCase();

    // 1. Try finding by email
    let user = await User.findOne({ email: cleanEmail });

    // 2. If not found, try finding by Employee ID
    if (!user) {
      const emp = await Employee.findOne({
        $or: [{ employeeCode: upperCode }, { email: cleanEmail }],
      });
      if (emp?.userId) {
        user = await User.findById(emp.userId);
      } else if (emp?.email) {
        user = await User.findOne({ email: emp.email.toLowerCase() });
      }
    }

    if (!user) {
      // For security, don't reveal whether user exists
      return NextResponse.json({
        success: true,
        message: 'If an account matches that email or Employee ID, password reset instructions have been dispatched.',
      });
    }

    // Generate random secure token
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Send reset email via SMTP
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token,
    });

    if (!emailResult.success) {
      console.warn('[Forgot Password] Email send warning:', emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset instructions have been sent to ${user.email}.`,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process password reset' },
      { status: 500 }
    );
  }
}

