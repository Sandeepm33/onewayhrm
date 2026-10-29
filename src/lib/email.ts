import nodemailer from 'nodemailer';

// Configuration from environment variables with fallbacks & sanitization
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const rawUser = process.env.SMTP_USER || 'shareitem4@gmail.com';
// Normalize if user prefixed with 'your-'
const smtpUser = rawUser.replace(/^your-/, '');
const smtpPass = process.env.SMTP_PASS || 'xpemeevaquxgsuiw';
const mailFrom = process.env.MAIL_FROM || `OneWayHR SaaS <${smtpUser}>`;

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'OneWayHR';

export const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Core generic send email helper
 */
export async function sendEmail({ to, subject, html, text }: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const info = await transporter.sendMail({
      from: mailFrom,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' '),
    });
    console.log(`[Email Service] Sent "${subject}" to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   HTML EMAIL LAYOUT WRAPPER
   ───────────────────────────────────────────────────────────────────────────── */
function emailLayout(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 28px; text-align: center; }
    .logo { font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; }
    .logo-accent { color: #f97316; }
    .badge { display: inline-block; background: rgba(255,255,255,0.12); color: #fed7aa; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 36px 32px; }
    .h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff !important; padding: 13px 28px; border-radius: 10px; font-size: 13px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 12px rgba(249,115,22,0.3); margin: 20px 0; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #e2e8f0; font-size: 13px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-weight: 600; }
    .info-val { color: #0f172a; font-weight: 800; font-family: monospace; }
    .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
    .footer a { color: #64748b; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">OneWay<span class="logo-accent">HR</span></div>
      <div class="badge">Enterprise Multi-Tenant SaaS</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px;">Multi-Tenant Enterprise Isolation & Statutory 256-Bit TLS Encryption.</p>
      <p style="margin: 0;">© ${new Date().getFullYear()} ${appName} Technologies Inc. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. PASSWORD RESET / ACTIVATION 6-DIGIT OTP EMAIL
   ───────────────────────────────────────────────────────────────────────────── */
export async function sendPasswordResetOtpEmail({
  to,
  name,
  otp,
  isFirstTime = false,
}: {
  to: string;
  name: string;
  otp: string;
  isFirstTime?: boolean;
}) {
  const subject = isFirstTime
    ? `🔑 Your 6-Digit Workspace Activation Code: ${otp} - ${appName}`
    : `🔐 Your 6-Digit Password Reset OTP: ${otp} - ${appName}`;

  const heading = isFirstTime
    ? 'Activate Your Workspace Account'
    : 'Reset Your Workspace Password';

  const subtext = isFirstTime
    ? 'Please use the 6-digit verification code below to activate your account and choose your private permanent password.'
    : 'We received a request to reset your workspace password. Use the 6-digit one-time password (OTP) below to proceed.';

  const html = emailLayout(
    heading,
    `
    <h1 class="h1">${heading}</h1>
    <p class="p">Hello <strong>${name}</strong>,</p>
    <p class="p">${subtext}</p>
    
    <div style="text-align: center; margin: 28px 0;">
      <div style="display: inline-block; background: #fff7ed; border: 2px dashed #f97316; border-radius: 16px; padding: 18px 40px; box-shadow: 0 4px 16px rgba(249,115,22,0.12);">
        <div style="font-size: 11px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
          Your 6-Digit Verification Code
        </div>
        <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #0f172a; font-family: 'Courier New', Courier, monospace;">
          ${otp}
        </div>
      </div>
    </div>

    <div class="info-card">
      <p class="p" style="margin-bottom: 6px; font-size: 12px; color: #64748b; font-weight: 700;">
        Security Notice:
      </p>
      <p class="p" style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6;">
        • This 6-digit code will expire in <strong>10 minutes</strong>.<br>
        • Never share your verification code with anyone, including ${appName} administrators.<br>
        • If you did not request this verification code, please disregard this email.
      </p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/reset-password?email=${encodeURIComponent(to)}" class="btn">Enter Code & Set Password →</a>
    </div>
    `
  );

  return sendEmail({ to, subject, html });
}

/* ─────────────────────────────────────────────────────────────────────────────
   1B. LEGACY PASSWORD RESET LINK (BACKWARDS COMPATIBILITY)
   ───────────────────────────────────────────────────────────────────────────── */
export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: {
  to: string;
  name: string;
  token: string;
}) {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  const subject = `🔐 Password Reset Request - ${appName}`;
  const html = emailLayout(
    'Password Reset Request',
    `
    <h1 class="h1">Reset Your Workspace Password</h1>
    <p class="p">Hello <strong>${name}</strong>,</p>
    <p class="p">We received a request to reset the password for your ${appName} workspace account associated with <strong>${to}</strong>.</p>
    
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Set New Password →</a>
    </div>

    <div class="info-card">
      <p class="p" style="margin-bottom: 8px; font-size: 12px; color: #64748b;">
        <strong>Security Notice:</strong>
      </p>
      <p class="p" style="margin: 0; font-size: 12px; color: #64748b;">
        • This reset link is single-use and will expire in <strong>60 minutes</strong>.<br>
        • If you did not make this request, you can safely disregard this email; your existing password remains secure.<br>
        • Never forward or share this link with anyone.
      </p>
    </div>

    <p class="p" style="font-size: 12px; color: #94a3b8;">
      If the button above does not work, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}" style="color: #f97316; word-break: break-all;">${resetUrl}</a>
    </p>
    `
  );

  return sendEmail({ to, subject, html });
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. PASSWORD RESET SUCCESS CONFIRMATION EMAIL
   ───────────────────────────────────────────────────────────────────────────── */
export async function sendPasswordChangedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const subject = `✅ Password Successfully Updated - ${appName}`;
  const loginUrl = `${appUrl}/login`;
  const html = emailLayout(
    'Password Successfully Changed',
    `
    <h1 class="h1">Password Updated Successfully</h1>
    <p class="p">Hello <strong>${name}</strong>,</p>
    <p class="p">Your password for your ${appName} workspace account (<strong>${to}</strong>) has been changed successfully.</p>
    
    <div class="info-card">
      <p class="p" style="margin: 0; font-size: 12px; color: #059669; font-weight: 700;">
        ✓ Account security is intact and your new password is now active.
      </p>
    </div>

    <p class="p">If you did not perform this action, please alert your organization administrator immediately or reply to this email for urgent access revocation.</p>

    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Sign In to Workspace →</a>
    </div>
    `
  );

  return sendEmail({ to, subject, html });
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. TEMPORARY PASSWORD / NEW USER ONBOARDING EMAIL
   ───────────────────────────────────────────────────────────────────────────── */
export async function sendTemporaryPasswordWelcomeEmail({
  to,
  name,
  temporaryPassword,
  organizationName,
  roleName = 'Employee',
  resetToken,
}: {
  to: string;
  name: string;
  temporaryPassword: string;
  organizationName: string;
  roleName?: string;
  resetToken?: string;
}) {
  const activateUrl = resetToken
    ? `${appUrl}/reset-password?token=${resetToken}&mustReset=true`
    : `${appUrl}/login`;

  const subject = `🎉 Welcome to ${organizationName} on ${appName} - Your Temporary Credentials`;
  const html = emailLayout(
    'Welcome to OneWayHR',
    `
    <h1 class="h1">Welcome to ${organizationName}!</h1>
    <p class="p">Hello <strong>${name}</strong>,</p>
    <p class="p">Your workplace account has been successfully provisioned on <strong>${appName}</strong> with the role of <strong>${roleName}</strong>.</p>
    
    <div class="info-card">
      <div style="font-weight: 800; color: #0f172a; margin-bottom: 10px; font-size: 13px;">Your Temporary Login Credentials:</div>
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Organization:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">${organizationName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Login Email / ID:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #0f172a; font-family: monospace;">${to}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Temporary Password:</td>
          <td style="padding: 6px 0; font-weight: 900; color: #ea580c; font-family: monospace; font-size: 15px; letter-spacing: 0.5px;">${temporaryPassword}</td>
        </tr>
      </table>
    </div>

    <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px; margin: 18px 0;">
      <p class="p" style="margin: 0; font-size: 12px; color: #c2410c; font-weight: 700;">
        ⚠️ Mandatory Security Step:
      </p>
      <p class="p" style="margin: 4px 0 0; font-size: 12px; color: #9a3412;">
        For enterprise compliance, you are required to reset this temporary password to your private permanent password upon first signing in.
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${activateUrl}" class="btn">Activate Account & Set Password →</a>
    </div>
    `
  );

  return sendEmail({ to, subject, html });
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. NEW TENANT ORGANIZATION PROVISIONED (SUPER ADMIN → ORG ADMIN)
   ───────────────────────────────────────────────────────────────────────────── */
export async function sendTenantProvisionedEmail({
  to,
  adminName,
  organizationName,
  organizationSlug,
  temporaryPassword,
  plan,
  resetToken,
}: {
  to: string;
  adminName: string;
  organizationName: string;
  organizationSlug: string;
  temporaryPassword: string;
  plan: string;
  resetToken?: string;
}) {
  const loginUrl = resetToken
    ? `${appUrl}/reset-password?token=${resetToken}&mustReset=true`
    : `${appUrl}/login`;

  const subject = `🚀 Workspace Provisioned: ${organizationName} on ${appName}`;
  const html = emailLayout(
    'Tenant Workspace Provisioned',
    `
    <h1 class="h1">Your Tenant Workspace is Live!</h1>
    <p class="p">Dear <strong>${adminName}</strong>,</p>
    <p class="p">Congratulations! Your isolated multi-tenant organization workspace for <strong>${organizationName}</strong> has been provisioned on ${appName}.</p>
    
    <div class="info-card">
      <div style="font-weight: 800; color: #0f172a; margin-bottom: 10px; font-size: 13px;">Provisioning Summary & Master Credentials:</div>
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Organization Name:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">${organizationName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Workspace Slug:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #4338ca; font-family: monospace;">${organizationSlug}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Subscription Tier:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #059669;">${plan}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Admin Email:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #0f172a; font-family: monospace;">${to}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Temporary Admin Password:</td>
          <td style="padding: 6px 0; font-weight: 900; color: #ea580c; font-family: monospace; font-size: 15px;">${temporaryPassword}</td>
        </tr>
      </table>
    </div>

    <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 14px; margin: 18px 0;">
      <p class="p" style="margin: 0; font-size: 12px; color: #3730a3; font-weight: 700;">
        ⚡ First-Time Admin Requirement:
      </p>
      <p class="p" style="margin: 4px 0 0; font-size: 12px; color: #4338ca;">
        Please sign in and set your permanent administrator password to finalize your workspace deployment.
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Launch Admin Workspace →</a>
    </div>
    `
  );

  return sendEmail({ to, subject, html });
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. BIRTHDAY & WORK ANNIVERSARY WISHES EMAIL
   ───────────────────────────────────────────────────────────────────────────── */
export async function sendCelebrationWishEmail({
  to,
  recipientName,
  senderName,
  celebrationType,
  organizationName,
}: {
  to: string;
  recipientName: string;
  senderName: string;
  celebrationType: 'BIRTHDAY' | 'WORK_ANNIVERSARY' | 'NEW_JOINER';
  organizationName: string;
}) {
  const isBday = celebrationType === 'BIRTHDAY';
  const isAnniversary = celebrationType === 'WORK_ANNIVERSARY';
  const emoji = isBday ? '🎂' : isAnniversary ? '🎉' : '🌟';
  const title = isBday
    ? 'Happy Birthday from your Team!'
    : isAnniversary
    ? 'Happy Work Anniversary!'
    : 'Welcome to the Team!';

  const subject = `${emoji} ${title} - ${organizationName}`;

  const message = isBday
    ? `Wishing you a very Happy Birthday! May your year ahead be full of achievements, good health, and joyful moments.`
    : isAnniversary
    ? `Congratulations on your Work Anniversary! Thank you for your continued dedication, innovation, and passion.`
    : `A very warm welcome to ${organizationName}! We're thrilled to have you onboard and excited for all the great milestones ahead.`;

  const html = emailLayout(
    title,
    `
    <div style="text-align: center; padding: 16px 0;">
      <div style="font-size: 48px; margin-bottom: 12px;">${emoji}</div>
      <h1 class="h1" style="font-size: 22px; color: #0f172a;">${title}</h1>
      <p class="p" style="font-size: 16px; font-weight: 700; color: #f97316;">Dear ${recipientName},</p>
      <p class="p" style="font-size: 15px; max-width: 460px; margin: 0 auto 20px; line-height: 1.6;">
        "${message}"
      </p>
      
      <div style="background: #f1f5f9; display: inline-block; padding: 10px 20px; border-radius: 999px; font-size: 12px; font-weight: 700; color: #334155; margin-top: 10px;">
        Sent with warm wishes from <strong>${senderName}</strong> & the <strong>${organizationName}</strong> team
      </div>
    </div>
    `
  );

  return sendEmail({ to, subject, html });
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. LEAVE REQUEST STATUS NOTIFICATION EMAIL
   ───────────────────────────────────────────────────────────────────────────── */
export async function sendLeaveStatusEmail({
  to,
  employeeName,
  leaveType,
  dates,
  status,
  approverComments,
}: {
  to: string;
  employeeName: string;
  leaveType: string;
  dates: string;
  status: 'APPROVED' | 'REJECTED';
  approverComments?: string;
}) {
  const isApproved = status === 'APPROVED';
  const subject = `${isApproved ? '✅' : '❌'} Leave Request ${status} - ${dates}`;
  const html = emailLayout(
    `Leave Request ${status}`,
    `
    <h1 class="h1">Leave Request ${status}</h1>
    <p class="p">Hello <strong>${employeeName}</strong>,</p>
    <p class="p">Your recent leave application has been <strong>${status.toLowerCase()}</strong>.</p>
    
    <div class="info-card">
      <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Leave Type:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">${leaveType}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Duration:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #0f172a;">${dates}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Decision:</td>
          <td style="padding: 6px 0; font-weight: 800; color: ${isApproved ? '#059669' : '#dc2626'};">${status}</td>
        </tr>
        ${
          approverComments
            ? `
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Reviewer Note:</td>
          <td style="padding: 6px 0; color: #334155; font-style: italic;">"${approverComments}"</td>
        </tr>
        `
            : ''
        }
      </table>
    </div>

    <div style="text-align: center;">
      <a href="${appUrl}/leave" class="btn">View Leave Balance →</a>
    </div>
    `
  );

  return sendEmail({ to, subject, html });
}

