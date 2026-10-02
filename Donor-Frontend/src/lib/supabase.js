// Donor-Frontend Supabase client (publishable key only — never secret/service_role).
// Supabase-only OTP (Option A: JWT stays, OTP via Supabase Email OTP).
// Env (user manages .env.local — this file only reads):
//   VITE_SUPABASE_URL=https://xyz.supabase.co
//   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
//   VITE_API_URL=http://localhost:5000
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing — email OTP will not work. Add to .env.local and restart Vite."
  );
}

export function isSupabaseConfigured() {
  if (!url || !key) return false;
  return !/paste_here|placeholder|your_key/i.test(String(key));
}

export const supabase = createClient(url ?? "", key ?? "");

export default supabase;
