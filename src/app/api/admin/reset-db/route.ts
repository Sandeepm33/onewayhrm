import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database handle is undefined');
    }

    const collections = await db.collections();
    const summary: Record<string, number> = {};

    for (const collection of collections) {
      const count = await collection.countDocuments();
      summary[collection.collectionName] = count;
      await collection.deleteMany({});
    }

    return NextResponse.json({
      success: true,
      message: 'All collections and login records have been purged successfully.',
      clearedCollectionsCount: collections.length,
      summary,
    });
  } catch (error: any) {
    console.error('Reset DB error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
