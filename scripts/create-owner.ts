import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

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

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, default: 'SUPER_ADMIN' },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createOwner() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoUri as string);
  console.log('Connected!');

  const email = 'owner@onewayhr.com';
  const password = 'Owner@12345';
  const name = 'OneWayHR Platform Owner';

  // Check if owner exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Platform Owner already exists with email: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const owner = await User.create({
    email,
    passwordHash,
    name,
    role: 'SUPER_ADMIN',
    isActive: true,
  });

  console.log('====================================================');
  console.log('PLATFORM OWNER CREATED SUCCESSFULLY:');
  console.log(`Name:     ${owner.name}`);
  console.log(`Email:    ${owner.email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     ${owner.role}`);
  console.log('====================================================');

  await mongoose.disconnect();
}

createOwner().catch((err) => {
  console.error('Error creating owner:', err);
  process.exit(1);
});
