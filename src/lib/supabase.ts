import { createClient } from '@supabase/supabase-js';
import { supabase as directClient } from '../supabaseClient';

function getValidSupabaseUrl(): string {
  let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  if (!rawUrl || rawUrl.includes('yaytvvzvlygkujuxvxmg') || rawUrl.includes('your-project')) {
    return '';
  }
  if (rawUrl.startsWith('https:https://')) {
    rawUrl = rawUrl.replace('https:https://', 'https://');
  } else if (rawUrl.startsWith('http:http://')) {
    rawUrl = rawUrl.replace('http:http://', 'http://');
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // Invalid URL
  }
  return '';
}

const supabaseUrl = getValidSupabaseUrl();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

let supabaseInstance: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseAnonKey && !supabaseAnonKey.startsWith('sb_publishable_HiM3y')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    supabaseInstance = null;
  }
}

if (!supabaseInstance && directClient) {
  supabaseInstance = directClient as ReturnType<typeof createClient>;
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = Boolean(supabaseInstance);



