// backend/test-smoke.js — ESM, zero deps. Run with workdir backend/: `node test-smoke.js`
// Checks expected backend files exist. Tolerates missing files: reports FAIL,
// never throws — exit code is 1 if anything is missing, 0 if all present.
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url)); // backend/

const FILES = [
  // index
  'src/index.js',
  // config
  'src/config/db.js',
  'src/config/env.js',
  // models x6
  'src/models/User.js',
  'src/models/Donor.js',
  'src/models/BloodRequest.js',
  'src/models/BloodUnit.js',
  'src/models/Otp.js',
  'src/models/AuditLog.js',
  // schemas x5
  'src/schemas/auth.schema.js',
  'src/schemas/donor.schema.js',
  'src/schemas/otp.schema.js',
  'src/schemas/request.schema.js',
  'src/schemas/unit.schema.js',
  // routes x6
  'src/routes/auth.routes.js',
  'src/routes/otp.routes.js',
  'src/routes/donors.routes.js',
  'src/routes/requests.routes.js',
  'src/routes/units.routes.js',
  'src/routes/availability.routes.js',
  // controllers x6
  'src/controllers/auth.controller.js',
  'src/controllers/otp.controller.js',
  'src/controllers/donors.controller.js',
  'src/controllers/requests.controller.js',
  'src/controllers/units.controller.js',
  'src/controllers/availability.controller.js',
  // middleware x6
  'src/middleware/auth.js',
  'src/middleware/roles.js',
  'src/middleware/validate.js',
  'src/middleware/error.js',
  'src/middleware/rateLimit.js',
  'src/middleware/audit.js',
  // utils x4
  'src/utils/passwords.js',
  'src/utils/jwt.js',
  'src/utils/otp.js',
  'src/utils/ids.js',
  // services
  'src/services/supabase-verify.service.js',
  'src/services/email.service.js',
  // seed / deploy / env
  'seed.js',
  'Dockerfile',
  'render.yaml',
  '.env.example',
];

let pass = 0;
let fail = 0;

for (const rel of FILES) {
  let ok = false;
  try {
    ok = existsSync(join(ROOT, rel));
  } catch {
    ok = false; // tolerate: report FAIL, never crash
  }
  if (ok) {
    pass += 1;
    console.log(`PASS ${rel}`);
  } else {
    fail += 1;
    console.log(`FAIL ${rel} — missing`);
  }
}

console.log(`\nsummary: ${pass}/${FILES.length} passed, ${fail} missing`);
if (fail > 0) {
  console.log('smoke: FAIL (missing files — siblings may still be working; re-run later)');
  process.exit(1);
} else {
  console.log('smoke: PASS (all expected files present)');
}
