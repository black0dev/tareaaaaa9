import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    if (typeof window === "undefined") {
      console.warn(
        "Supabase: NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY no configurados. " +
          "Usando valores por defecto para build. Asegurate de configurarlos en produccion."
      );
    }
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Uso de lazy initialization para no fallar durante el build de Next.js
// cuando las variables de entorno no estan disponibles.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createSupabaseClient();
  }
  return _client;
}

/**
 * Cliente de Supabase para consultas a la base de datos.
 * Uso: supabase.from("tabla").select("*")
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
