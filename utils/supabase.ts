import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vhqpsnezcvqgikpqzdgk.supabase.co';
const supabasePublishableKey = 'sb_publishable_Qi1OhFZksZhC0ONgzE6ojQ_3VO0zWhU';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
