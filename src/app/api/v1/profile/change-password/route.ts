import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest, hashPassword, comparePassword } from '@/lib/auth';
import { User } from '@/models/User';
import { AuditLog } from '@/models/Operations';

/**
 * POST /api/v1/profile/change-password
 * Allows the authenticated user to change their account password.
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password, new password, and confirmation are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Incorrect current password. Please try again.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    user.passwordHash = newHash;
    await user.save();

    if (user.organizationId) {
      await AuditLog.create({
        organizationId: user.organizationId,
        userId: user._id,
        userName: user.name,
        action: 'PASSWORD_CHANGED',
        entityType: 'User',
        entityId: String(user._id),
        details: { email: user.email },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully! Please use your new password next time you log in.',
    });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
