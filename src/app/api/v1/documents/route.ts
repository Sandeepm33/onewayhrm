import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { IssuedDocument, DocumentTemplate } from '@/models/DocumentManagement';
import { Organization } from '@/models/Organization';
import { Employee } from '@/models/Employee';
import { Candidate } from '@/models/Recruitment';
import { AuditLog } from '@/models/Operations';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const documentType = searchParams.get('type');
    const employeeId = searchParams.get('employeeId');

    const query: any = { organizationId: session.organizationId };

    if (session.role === 'EMPLOYEE' && session.employeeId) {
      query.employeeId = session.employeeId;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (documentType) query.documentType = documentType;

    const documents = await IssuedDocument.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error('Fetch documents error:', error);
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

    const body = await req.json();
    const { documentType, employeeId, candidateId, recipientName, recipientEmail, title, customContent } = body;

    const org = await Organization.findById(session.organizationId);
    if (!org) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 });
    }

    const count = await IssuedDocument.countDocuments({ organizationId: session.organizationId });
    const documentNumber = `DOC-${documentType.substring(0, 5)}-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    let content = customContent;
    if (!content) {
      // Default generated content
      content = `REF: ${documentNumber}\nDATE: ${new Date().toLocaleDateString('en-IN')}\n\nTO: ${recipientName}\nEMAIL: ${recipientEmail}\n\n` +
        `Subject: ${title}\n\nThis is an officially issued document from ${org.name}.\n` +
        `This letter certifies your records in accordance with the policies and terms of ${org.name}.\n\n` +
        `Authorized Signatory,\nHuman Resources & People Operations\n${org.name}`;
    }

    const issuedDoc = await IssuedDocument.create({
      organizationId: session.organizationId,
      documentType,
      documentNumber,
      employeeId: employeeId || undefined,
      candidateId: candidateId || undefined,
      recipientName,
      recipientEmail,
      title,
      content,
      status: 'ISSUED',
      issuedBy: session.userId as any,
      issuedAt: new Date(),
    });

    await AuditLog.create({
      organizationId: session.organizationId,
      userId: session.userId,
      userName: session.name,
      action: 'DOCUMENT_ISSUED',
      entityType: 'IssuedDocument',
      entityId: String(issuedDoc._id),
      details: { documentType, documentNumber, recipientName },
    });

    return NextResponse.json({ success: true, document: issuedDoc });
  } catch (error: any) {
    console.error('Generate document error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
