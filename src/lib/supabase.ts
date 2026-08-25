import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Aviso: Chaves do Supabase não configuradas no ambiente (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY). O tempo real do chat não funcionará corretamente.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
