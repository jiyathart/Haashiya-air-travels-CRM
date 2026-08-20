import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || 'https://cbzbhtcffazkgfmfwffm.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiemJodGNmZmF6a2dmbWZ3ZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NzUxMzksImV4cCI6MjEwMjI1MTEzOX0.qSbw_Kf36vWu7F6iNDbxSScauoeJIieX4oqtc7W71DQ';

const supabase = createClient(url, key);

async function run() {
  const emailsToRemove = [
    'admin@haashiyatravels.com',
    'mdsha7576@gmail.com',
    'haashiyacsc@gmail.com'
  ];
  
  for (const email of emailsToRemove) {
    const { data, error } = await supabase.from('staff').delete().eq('email', email);
    console.log('Deleted', email, error ? error : 'Success');
  }
}
run();
