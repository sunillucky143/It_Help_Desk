import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Keep it loud in dev so you don’t get a blank screen
  // (You’ll still be able to see this in console)
  console.error(
    "Supabase not initialized: REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY is missing"
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
