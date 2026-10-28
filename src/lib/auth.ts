import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hrms_saas_jwt_key_2026_india_token_production';

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  roleId?: string;
  organizationId: string;
  employeeId?: string;
  branchId?: string;
  departmentId?: string;
  canCustomizeSaas?: boolean;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(payload: UserSessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): UserSessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSessionPayload;
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest): UserSessionPayload | null {
  // Check authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyJwtToken(token);
    if (decoded) return decoded;
  }

  // Check cookies
  const cookieToken = request.cookies.get('hrms_token')?.value;
  if (cookieToken) {
    const decoded = verifyJwtToken(cookieToken);
    if (decoded) return decoded;
  }

  return null;
}
