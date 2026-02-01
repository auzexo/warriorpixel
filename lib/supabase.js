// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Your Supabase credentials
const supabaseUrl = 'https://viqllwnggbohvydtnxcv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcWxsd25nZ2JvaHZ5ZHRueGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTI4NzgsImV4cCI6MjA4NTQyODg3OH0.CxSC6cJ6QSWRbLYROz3CXpQzepDHEYiJMGf_KKbOJ98';

// Client for browser (public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper: Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
};

// Helper: Check if user is admin
export const isUserAdmin = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  if (error) return false;
  return data?.is_admin || false;
};
