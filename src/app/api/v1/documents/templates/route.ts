import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { DocumentTemplate } from '@/models/DocumentManagement';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await DocumentTemplate.find({ organizationId: session.organizationId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('Fetch templates error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { type, title, templateBody } = await req.json();

    if (!type || !title || !templateBody) {
      return NextResponse.json({ success: false, error: 'Type, title, and templateBody are required' }, { status: 400 });
    }

    const template = await DocumentTemplate.create({
      organizationId: session.organizationId,
      type,
      title,
      templateBody,
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error('Create template error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
