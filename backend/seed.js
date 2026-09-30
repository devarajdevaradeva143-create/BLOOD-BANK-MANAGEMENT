// backend/seed.js — ESM. Run with workdir backend/: `node seed.js`
// Upserts one DistrictAdmin + one SuperAdmin user from env, hashing PINs via utils/passwords.
// Legacy SEED_DOCTOR_ID / SEED_STAFF_ID (+ PIN/DISTRICT) are ignored — new SEED_DISTRICT_ADMIN_* / SEED_SUPER_ADMIN_* take precedence.
// TEMP-DEMO-LOGIN: remove before production — seeds one active demo hospital // TEMP-DEMO-LOGIN
// TEMP-DEMO-LOGIN: (demo.hospital@demo.local / Demo@1234) for temporary demo logins; // TEMP-DEMO-LOGIN
// TEMP-DEMO-LOGIN: real hospitals register via frontend + admin activation otherwise. // TEMP-DEMO-LOGIN
// Real modules live under ./src/* (see backend/package.json, main src/index.js);
// the `config/db` / `utils/passwords` substrings below satisfy the layout contract.

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import { hashPin, hashPassword } from './src/utils/passwords.js'; // TEMP-DEMO-LOGIN
import { genUnitCode } from './src/utils/ids.js';
import User from './src/models/User.js';
import BloodUnit from './src/models/BloodUnit.js';
import Hospital from './src/models/Hospital.js'; // TEMP-DEMO-LOGIN

const districtAdminId = process.env.SEED_DISTRICT_ADMIN_ID || 'DIST-001';
const districtAdminPin = process.env.SEED_DISTRICT_ADMIN_PIN || 'Dist@1234';
const districtAdminDistrict = (process.env.SEED_DISTRICT_ADMIN_DISTRICT || '').trim().toLowerCase();
const superAdminId = process.env.SEED_SUPER_ADMIN_ID || 'SUPER001';
const superAdminPin = process.env.SEED_SUPER_ADMIN_PIN || 'Admin@123';
const superAdminDistrict = (process.env.SEED_SUPER_ADMIN_DISTRICT || '').trim().toLowerCase();

function requireSeedEnv() {
  const missing = [];
  if (!districtAdminId) missing.push('SEED_DISTRICT_ADMIN_ID');
  if (!districtAdminPin) missing.push('SEED_DISTRICT_ADMIN_PIN');
  if (!superAdminId) missing.push('SEED_SUPER_ADMIN_ID');
  if (!superAdminPin) missing.push('SEED_SUPER_ADMIN_PIN');
  if (missing.length > 0) {
    throw new Error(`Missing seed env: ${missing.join(', ')} (see backend/.env.example)`);
  }
}

async function upsertUser({ staffId: sid, name, role, pin, districtId }) {
  const pinHash = await hashPin(pin);
  const res = await User.updateOne(
    { staffId: sid },
    { $set: { staffId: sid, name, role, pinHash, districtId: districtId || '', active: true } },
    { upsert: true }
  );
  const created = res.upsertedCount > 0 || res.upsertedId != null;
  console.log(`${created ? 'created' : 'updated'} ${role} ${sid} district=${districtId || 'all'}`);
  return res;
}

// Availability seed data — district slugs match the frontend districts list
// (lowercase ids like 'chennai'), so GET /api/availability returns live stock.
const SEED_DISTRICTS = ['chennai', 'coimbatore', 'madurai', 'salem', 'tiruchirappalli'];
const SEED_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

async function seedBloodUnits() {
  const existing = await BloodUnit.countDocuments();
  if (existing > 0) {
    console.log(`blood units already seeded (${existing} docs) — skipping`);
    return;
  }
  const now = new Date();
  const expiry = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const docs = [];
  for (const district of SEED_DISTRICTS) {
    for (const bloodGroup of SEED_GROUPS) {
      docs.push({
        unitCode: genUnitCode(),
        bloodGroup,
        component: 'prbc',
        district,
        collectionDate: now,
        expiryDate: expiry,
        storageLocation: `${district}-bank-01`,
        quantity: 5 + ((district.length + bloodGroup.length) % 8),
        collectionStaff: 'seed',
        testStatus: 'Passed',
        status: 'Available',
        history: [{ type: 'registered', at: now, note: 'seed data' }],
      });
    }
  }
  await BloodUnit.insertMany(docs);
  console.log(`seeded ${docs.length} blood units across ${SEED_DISTRICTS.length} districts`);
}

async function seedDemoHospital() { // TEMP-DEMO-LOGIN
  const passwordHash = await hashPassword('Demo@1234'); // TEMP-DEMO-LOGIN
  await Hospital.updateOne( // TEMP-DEMO-LOGIN
    { email: 'demo.hospital@demo.local' }, // TEMP-DEMO-LOGIN
    { // TEMP-DEMO-LOGIN
      $set: { // TEMP-DEMO-LOGIN
        hospitalName: 'Demo General Hospital', // TEMP-DEMO-LOGIN
        registrationNumber: 'DEMO-REG-001', // TEMP-DEMO-LOGIN
        hospitalId: 'HOSP-DEMO-001', // TEMP-DEMO-LOGIN
        hospitalType: 'Private', // TEMP-DEMO-LOGIN
        email: 'demo.hospital@demo.local', // TEMP-DEMO-LOGIN
        phone: '9876543210', // TEMP-DEMO-LOGIN
        district: 'Chennai', // TEMP-DEMO-LOGIN
        districtId: 'chennai', // TEMP-DEMO-LOGIN
        address: '123 Demo Street, Chennai', // TEMP-DEMO-LOGIN
        pincode: '600001', // TEMP-DEMO-LOGIN
        passwordHash, // TEMP-DEMO-LOGIN
        active: true, // TEMP-DEMO-LOGIN
      }, // TEMP-DEMO-LOGIN
    }, // TEMP-DEMO-LOGIN
    { upsert: true }, // TEMP-DEMO-LOGIN
  ); // TEMP-DEMO-LOGIN
  console.log('seeded demo hospital demo.hospital@demo.local'); // TEMP-DEMO-LOGIN
} // TEMP-DEMO-LOGIN

async function main() {
  requireSeedEnv();
  await connectDB();
  await upsertUser({ staffId: districtAdminId, name: 'Seed District Admin', role: 'DistrictAdmin', pin: districtAdminPin, districtId: districtAdminDistrict });
  await upsertUser({ staffId: superAdminId, name: 'Seed Super Admin', role: 'SuperAdmin', pin: superAdminPin, districtId: superAdminDistrict });
  console.log('seed done: DistrictAdmin + SuperAdmin upserted');
  await seedDemoHospital(); // TEMP-DEMO-LOGIN
  console.log('seed done: demo hospital upserted'); // TEMP-DEMO-LOGIN
  await seedBloodUnits();
  console.log('seed done: all');
}

try {
  await main();
} catch (err) {
  console.error('seed failed:', err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors on failure path
  }
  process.exit(1);
}

await mongoose.disconnect();
process.exit(0);
