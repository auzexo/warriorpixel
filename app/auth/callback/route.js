import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Exchange code for session
      await supabase.auth.exchangeCodeForSession(code);
      
      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (user) {
        // Check if user profile exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id, discord_id')
          .eq('id', user.id)
          .single();

        // Extract Discord data from user metadata
        const discordUsername = user.user_metadata?.custom_claims?.global_name || 
                               user.user_metadata?.full_name || 
                               user.user_metadata?.name ||
                               null;

        if (!existingProfile) {
          // First-time login - create profile
          await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              username: discordUsername || `user_${user.id.substring(0, 8)}`,
              discord_id: discordUsername,
              level: 1,
              xp: 0,
              xp_to_next_level: 100,
              is_verified: false,
              created_at: new Date().toISOString()
            });

          // Send welcome notification
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              title: '🎉 Welcome to WarriorPixel!',
              message: 'Complete your profile to get a verified badge and unlock all features. Add your Discord ID, phone, and email in the Profile section.',
              type: 'system',
              read: false
            });

        } else if (discordUsername && !existingProfile.discord_id) {
          // Existing user without Discord ID - update it
          await supabase
            .from('users')
            .update({ discord_id: discordUsername })
            .eq('id', user.id);
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }
  }

  // Always redirect to home
  return NextResponse.redirect(`${origin}/`);
}
