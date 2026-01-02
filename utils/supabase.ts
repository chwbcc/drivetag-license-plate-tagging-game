import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || 'https://vhqpsnezcvqgikpqzdgk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('[Supabase] Invalid supabaseUrl:', supabaseUrl);
  throw new Error('Invalid Supabase URL configuration');
}

if (!supabaseAnonKey) {
  console.error('[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY is not set!');
  throw new Error('Missing Supabase Anon Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
