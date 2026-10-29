import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getSessionFromRequest } from '@/lib/auth';
import { Holiday } from '@/models/Holiday';
import { resolveOrganizationId } from '@/lib/tenant';

export const DEFAULT_INDIAN_HOLIDAYS_2026 = [
  { name: 'New Year Day', date: '2026-01-01', type: 'OPTIONAL', description: 'Celebration of Gregorian New Year', isMandatory: false },
  { name: 'Makar Sankranti / Pongal', date: '2026-01-14', type: 'GAZETTED', description: 'Harvest festival across India', isMandatory: true },
  { name: 'Republic Day', date: '2026-01-26', type: 'NATIONAL', description: 'Constitution of India came into effect', isMandatory: true },
  { name: 'Maha Shivratri', date: '2026-02-16', type: 'GAZETTED', description: 'Lord Shiva celebration', isMandatory: true },
  { name: 'Holi', date: '2026-03-04', type: 'GAZETTED', description: 'Festival of Colours', isMandatory: true },
  { name: 'Id-ul-Fitr (Ramzan Eid)', date: '2026-03-21', type: 'GAZETTED', description: 'Islamic festival marking end of Ramadan', isMandatory: true },
  { name: 'Good Friday', date: '2026-04-03', type: 'GAZETTED', description: 'Christian holiday commemorating the crucifixion', isMandatory: true },
  { name: 'Dr. B.R. Ambedkar Jayanti', date: '2026-04-14', type: 'NATIONAL', description: 'Birth anniversary of Dr. B.R. Ambedkar', isMandatory: true },
  { name: 'Labor Day / May Day', date: '2026-05-01', type: 'COMPANY', description: 'International Workers Day', isMandatory: true },
  { name: 'Independence Day', date: '2026-08-15', type: 'NATIONAL', description: 'Indian Independence Day', isMandatory: true },
  { name: 'Raksha Bandhan', date: '2026-08-28', type: 'RESTRICTED', description: 'Celebration of brother-sister bond', isMandatory: false },
  { name: 'Janmashtami', date: '2026-09-04', type: 'GAZETTED', description: 'Birth of Lord Krishna', isMandatory: true },
  { name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'GAZETTED', description: 'Vinayaka Chaturthi celebration', isMandatory: true },
  { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02', type: 'NATIONAL', description: 'Birth anniversary of Mahatma Gandhi', isMandatory: true },
  { name: 'Dussehra (Vijayadashami)', date: '2026-10-20', type: 'GAZETTED', description: 'Triumph of good over evil', isMandatory: true },
  { name: 'Diwali (Deepavali)', date: '2026-11-08', type: 'GAZETTED', description: 'Festival of Lights', isMandatory: true },
  { name: 'Guru Nanak Jayanti', date: '2026-11-24', type: 'GAZETTED', description: 'Guru Nanak Dev Ji birth celebration', isMandatory: true },
  { name: 'Christmas Day', date: '2026-12-25', type: 'GAZETTED', description: 'Celebration of the birth of Jesus Christ', isMandatory: true },
];

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    const query: any = {
      organizationId: orgId,
    };
    if (yearParam) {
      query.year = year;
    }

    // Return strictly only dynamically registered holidays for this organization
    const holidays = await Holiday.find(query).sort({ date: 1 });

    return NextResponse.json({ success: true, holidays });
  } catch (error: any) {
    console.error('Fetch holidays error:', error);
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

    const orgId = await resolveOrganizationId(session);
    const body = await req.json();

    // Action: Optional explicit import of standard Indian holidays
    if (body.action === 'IMPORT_INDIAN_GAZETTED') {
      const year = Number(body.year) || new Date().getFullYear();
      const existing = await Holiday.find({ organizationId: orgId, year });
      const existingNames = new Set(existing.map((h) => h.name.toLowerCase()));

      const toInsert = DEFAULT_INDIAN_HOLIDAYS_2026.filter(
        (h) => !existingNames.has(h.name.toLowerCase())
      ).map((h) => ({
        ...h,
        organizationId: orgId,
        year,
      }));

      if (toInsert.length > 0) {
        await Holiday.insertMany(toInsert);
      }

      const updated = await Holiday.find({ organizationId: orgId, year }).sort({ date: 1 });
      return NextResponse.json({
        success: true,
        message: `Imported ${toInsert.length} holidays for ${year}.`,
        holidays: updated,
      });
    }

    const { name, date, type, description, isMandatory } = body;

    if (!name || !date) {
      return NextResponse.json({ success: false, error: 'Holiday name and date are required' }, { status: 400 });
    }

    const year = parseInt(date.split('-')[0], 10) || new Date().getFullYear();

    const holiday = await Holiday.create({
      organizationId: orgId,
      name: name.trim(),
      date,
      type: type || 'GAZETTED',
      description: description || '',
      isMandatory: isMandatory !== undefined ? isMandatory : true,
      year,
    });

    return NextResponse.json({
      success: true,
      holiday,
      message: `Holiday "${name}" registered successfully`,
    });
  } catch (error: any) {
    console.error('Create holiday error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = await resolveOrganizationId(session);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Holiday ID is required' }, { status: 400 });
    }

    await Holiday.findOneAndDelete({ _id: id, organizationId: orgId });

    return NextResponse.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
