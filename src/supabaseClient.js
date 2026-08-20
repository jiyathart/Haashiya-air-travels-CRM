import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// SUPABASE CONFIGURATION
// Replace the values below with your own Supabase URL and Publishable / Anon Key
// ==============================================================================
const rawUrl = (import.meta.env?.VITE_SUPABASE_URL || "https://yaytvvzvlygkujuxvxmg.supabase.co" || "").trim();
const SUPABASE_PUBLIC_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_HiM3yBFWkczEEVYFOGJkAg_FhMmq0D1" || "").trim();

function getValidUrl(urlString) {
  if (!urlString) return '';
  let cleaned = urlString;
  if (cleaned.startsWith('https:https://')) cleaned = cleaned.replace('https:https://', 'https://');
  if (cleaned.startsWith('http:http://')) cleaned = cleaned.replace('http:http://', 'http://');
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // Invalid URL format
  }
  return '';
}

const SUPABASE_URL = getValidUrl(rawUrl);

let supabaseInstance = null;

if (SUPABASE_URL && SUPABASE_PUBLIC_KEY) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
  } catch (err) {
    console.warn('Failed to initialize Supabase client in supabaseClient.js:', err);
    supabaseInstance = null;
  }
}

// Export the initialized Supabase client
export const supabase = supabaseInstance;

