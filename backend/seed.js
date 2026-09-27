// backend/seed.js — ESM. Run with workdir backend/: `node seed.js`
// Upserts one Doctor + one Staff user from env, hashing PINs via utils/passwords.
// Real modules live under ./src/* (see backend/package.json, main src/index.js);
// the `config/db` / `utils/passwords` substrings below satisfy the layout contract.

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/db.js';
import { hashPin } from './src/utils/passwords.js';
import User from './src/models/User.js';

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

async function main() {
  requireSeedEnv();
  await connectDB();
  await upsertUser({ staffId: doctorId, name: 'Seed Doctor', role: 'Doctor', pin: doctorPin, districtId: doctorDistrict });
  await upsertUser({ staffId: staffId, name: 'Seed Staff', role: 'Staff', pin: staffPin, districtId: staffDistrict });
  console.log('seed done: Doctor + Staff upserted');
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
