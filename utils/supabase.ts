import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://vhqpsnezcvqgikpqzdgk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXBzbmV6Y3ZxZ2lrcHF6ZGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODA1NzcsImV4cCI6MjA1MTI1NjU3N30.Fb8XtbpGa6tZzkEOSZ1cGbMOdJZfLH3yB8u76hNyBQc';

const finalUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://vhqpsnezcvqgikpqzdgk.supabase.co';
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXBzbmV6Y3ZxZ2lrcHF6ZGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODA1NzcsImV4cCI6MjA1MTI1NjU3N30.Fb8XtbpGa6tZzkEOSZ1cGbMOdJZfLH3yB8u76hNyBQc';

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
