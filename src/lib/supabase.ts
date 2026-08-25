import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  console.warn(
    "Aviso: Chaves do Supabase não configuradas no ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY). O tempo real do chat não funcionará.",
  );
}
