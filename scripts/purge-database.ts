import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let mongoUri = process.env.MONGODB_URI;

if (!mongoUri && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('MONGODB_URI=')) {
      mongoUri = trimmed.substring('MONGODB_URI='.length).trim();
      break;
    }
  }
}

if (!mongoUri) {
  console.error('ERROR: MONGODB_URI not found');
  process.exit(1);
}

async function purgeAllData() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri as string);
  console.log('Connected successfully!');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database handle is undefined');
  }

  const collections = await db.collections();
  console.log(`Found ${collections.length} collections in database.`);

  for (const collection of collections) {
    const count = await collection.countDocuments();
    console.log(`Clearing collection: ${collection.collectionName} (${count} documents)...`);
    await collection.deleteMany({});
  }

  console.log('--- ALL DATA AND LOGINS DELETED SUCCESSFULLY ---');
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

purgeAllData().catch((err) => {
  console.error('Error during database purge:', err);
  process.exit(1);
});
