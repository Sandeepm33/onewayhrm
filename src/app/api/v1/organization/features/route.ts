import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { resolveOrganizationId } from '@/lib/tenant';
import { canUserCustomizeSaas } from '@/lib/permissions';
import { Organization, DEFAULT_SAAS_FEATURES, IOrgFeature } from '@/models/Organization';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization context required' }, { status: 400 });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const features = org.features && org.features.length > 0 ? org.features : DEFAULT_SAAS_FEATURES;
    return NextResponse.json({ success: true, features });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const canCustomize = await canUserCustomizeSaas(session);
    if (!canCustomize) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only Organization Admin or authorized users can customize SaaS features' },
        { status: 403 }
      );
    }

    const orgId = await resolveOrganizationId(session);
    if (!orgId) {
      return NextResponse.json({ success: false, error: 'Organization context required' }, { status: 400 });
    }

    const body = await req.json();
    const { features } = body;

    if (!Array.isArray(features)) {
      return NextResponse.json({ success: false, error: 'features must be an array' }, { status: 400 });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    org.features = features as IOrgFeature[];
    await org.save();

    return NextResponse.json({
      success: true,
      message: 'Organization feature modules customized successfully!',
      features: org.features,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
