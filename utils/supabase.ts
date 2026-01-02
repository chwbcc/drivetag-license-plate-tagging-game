import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://vhqpsnezcvqgikpqzdgk.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXBzbmV6Y3ZxZ2lrcHF6ZGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODA1NzcsImV4cCI6MjA1MTI1NjU3N30.Fb8XtbpGa6tZzkEOSZ1cGbMOdJZfLH3yB8u76hNyBQc';

function getValidUrl(envUrl: string | undefined): string {
  const trimmed = envUrl?.trim();
  if (trimmed && trimmed.length > 0 && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
    return trimmed;
  }
  return defaultUrl;
}

function getValidKey(envKey: string | undefined): string {
  const trimmed = envKey?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : defaultKey;
}

const finalUrl = getValidUrl(process.env.EXPO_PUBLIC_SUPABASE_URL);
const finalKey = getValidKey(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

console.log('[Supabase] Using URL:', finalUrl);
console.log('[Supabase] Key configured:', finalKey ? '✓' : '✗');

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
