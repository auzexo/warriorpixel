// app/auth/callback/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createUserProfile } from '@/lib/database';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Check if user profile exists
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // Create profile if doesn't exist (OAuth login)
      if (!profile) {
        const username = data.user.user_metadata.name || 
                        data.user.user_metadata.full_name || 
                        data.user.email.split('@')[0];
        
        await createUserProfile(data.user.id, {
          email: data.user.email,
          username: username,
          displayName: data.user.user_metadata.full_name || username,
          photoURL: data.user.user_metadata.avatar_url,
        });
      }
    }
  }

  return NextResponse.redirect(new URL('/', request.url));
}
