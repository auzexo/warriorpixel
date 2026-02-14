import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth exchange error:', error);
        return NextResponse.redirect(`${origin}/?error=auth_failed`);
      }

      console.log('OAuth successful:', data.user?.email);
      
      // Redirect to HOME page (not tournaments)
      return NextResponse.redirect(`${origin}/`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(`${origin}/?error=auth_error`);
    }
  }

  // No code, redirect to home
  return NextResponse.redirect(`${origin}/`);
}
