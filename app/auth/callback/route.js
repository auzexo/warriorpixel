import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  console.log('Auth callback triggered:', { code: !!code });

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth exchange error:', error);
        // Redirect to home with error
        return NextResponse.redirect(`${origin}/?auth=error`);
      }

      console.log('Auth successful for:', data.user?.email);
      
      // Wait a moment to ensure session is saved
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to home (the auth state will be picked up by useAuth)
      const response = NextResponse.redirect(`${origin}/`);
      
      // Set a flag to indicate successful auth
      response.cookies.set('auth_completed', 'true', {
        maxAge: 60, // 60 seconds
        path: '/',
      });
      
      return response;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(`${origin}/?auth=error`);
    }
  }

  // No code provided
  console.log('No auth code, redirecting to home');
  return NextResponse.redirect(`${origin}/`);
}
