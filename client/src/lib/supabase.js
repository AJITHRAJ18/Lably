// ============================================================
// Lably — Supabase Client (Frontend)
// Uses the public ANON key — safe to expose in the browser.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Lably] Supabase env vars not set. Auth features will be disabled.\n" +
    "Copy client/.env.example to client/.env and fill in your keys."
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
