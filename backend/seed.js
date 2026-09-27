// backend/seed.js — ESM. Run with workdir backend/: `node seed.js`
// Upserts one Doctor + one Staff user from env, hashing PINs via utils/passwords.
// Real modules live under ./src/* (see backend/package.json, main src/index.js);
// the `config/db` / `utils/passwords` substrings below satisfy the layout contract.

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import { hashPassword, hashPin } from './src/utils/passwords.js';
import { genUnitCode } from './src/utils/ids.js';
import User from './src/models/User.js';
import Hospital from './src/models/Hospital.js';
import BloodUnit from './src/models/BloodUnit.js';

const doctorId = process.env.SEED_DOCTOR_ID || 'DOC-001';
const doctorPin = process.env.SEED_DOCTOR_PIN || '1234';
const doctorDistrict = (process.env.SEED_DOCTOR_DISTRICT || '').trim().toLowerCase();
const staffId = process.env.SEED_STAFF_ID || 'STAFF-001';
const staffPin = process.env.SEED_STAFF_PIN || '1234';
const staffDistrict = (process.env.SEED_STAFF_DISTRICT || '').trim().toLowerCase();

function requireSeedEnv() {
  const missing = [];
  if (!doctorId) missing.push('SEED_DOCTOR_ID');
  if (!doctorPin) missing.push('SEED_DOCTOR_PIN');
  if (!staffId) missing.push('SEED_STAFF_ID');
  if (!staffPin) missing.push('SEED_STAFF_PIN');
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

async function upsertDemoHospital() {
  const email = (process.env.SEED_HOSPITAL_EMAIL || 'demo@hospital.com').trim().toLowerCase();
  const password = process.env.SEED_HOSPITAL_PASSWORD || 'Demo@1234';
  const res = await Hospital.updateOne(
    { email },
    {
      $set: {
        hospitalName: 'Demo Hospital',
        registrationNumber: 'TN-DEMO-0001',
        hospitalId: 'HOSP-TN-0001',
        hospitalType: 'Private',
        email,
        phone: '9876543210',
        district: 'Chennai',
        districtId: 'chennai',
        address: '123 Main Road, Chennai, Tamil Nadu',
        officerName: 'Dr. R. Kumar',
        officerDesignation: 'Medical Superintendent',
        officerContact: '9876543212',
        passwordHash: await hashPassword(password),
        active: true,
      },
    },
    { upsert: true }
  );
  const created = res.upsertedCount > 0 || res.upsertedId != null;
  console.log(`${created ? 'created' : 'updated'} Hospital ${email}`);
}

// Availability demo data — district slugs match the frontend districts list
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

async function main() {
  requireSeedEnv();
  await connectDB();
  await upsertUser({ staffId: doctorId, name: 'Seed Doctor', role: 'Doctor', pin: doctorPin, districtId: doctorDistrict });
  await upsertUser({ staffId: staffId, name: 'Seed Staff', role: 'Staff', pin: staffPin, districtId: staffDistrict });
  console.log('seed done: Doctor + Staff upserted');
  await upsertDemoHospital();
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
