// Aegis-Frontend Supabase client (publishable key only — never secret/service_role).
// Env (user manages .env.local — this file only reads):
//   VITE_SUPABASE_URL=https://giaolvbhthegetljcthz.supabase.co
//   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing — restart Vite after adding to .env.local');
}

export const supabase: SupabaseClient = createClient(url ?? '', key ?? '');

export default supabase;
