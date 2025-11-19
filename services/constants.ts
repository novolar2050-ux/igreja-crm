// Função helper para acessar variáveis de ambiente com segurança
// Evita erros "Cannot read properties of undefined" se import.meta.env não existir
const getEnv = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || fallback;
    }
  } catch (e) {
    // Ignora erros de acesso
  }
  return fallback;
};

export const SUPABASE_URL = getEnv("VITE_SUPABASE_URL", "https://jchbutgncqunjbuwwwgh.supabase.co");
export const SUPABASE_ANON_KEY = getEnv("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjaGJ1dGduY3F1bmpidXd3d2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NDAyMjcsImV4cCI6MjA3OTAxNjIyN30.mOBqQooCH5RcnDCdxjmEe3FT7IAaDEOrd-Qyfp0gr5g");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('CRITICAL: Supabase Keys missing.');
}