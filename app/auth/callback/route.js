import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const linking = requestUrl.searchParams.get('linking'); // 'discord' if linking flow

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      await supabase.auth.exchangeCodeForSession(code);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        // Get all linked identities
        const { data: identitiesData } = await supabase.auth.getUserIdentities();
        const identities = identitiesData?.identities || [];

        // Extract Discord identity if linked
        const discordIdentity = identities.find(i => i.provider === 'discord');
        const discordUsername = discordIdentity?.identity_data?.custom_claims?.global_name ||
                               discordIdentity?.identity_data?.full_name ||
                               discordIdentity?.identity_data?.name ||
                               discordIdentity?.identity_data?.user_name ||
                               null;

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id, discord_id, username')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // First-time login — create profile
          const displayName = discordUsername ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            `user_${user.id.substring(0, 8)}`;

          await supabase.from('users').insert({
            id: user.id,
            email: user.email,
            username: displayName,
            discord_id: discordUsername,
            level: 1,
            xp: 0,
            xp_to_next_level: 100,
            is_verified: false,
            created_at: new Date().toISOString()
          });

          await supabase.from('notifications').insert({
            user_id: user.id,
            title: '🎉 Welcome to WarriorPixel!',
            message: 'Complete your profile to get a verified badge. Add your Discord ID, phone, and email.',
            type: 'system',
            read: false
          });

        } else {
          // Existing user — update discord_id if newly linked
          if (discordUsername && !existingProfile.discord_id) {
            await supabase.from('users')
              .update({ discord_id: discordUsername })
              .eq('id', user.id);
          }

          // If this was a linking flow — send confirmation notification
          if (linking === 'discord' && discordUsername) {
            await supabase.from('notifications').insert({
              user_id: user.id,
              title: '✅ Discord Linked!',
              message: `Discord account "${discordUsername}" has been successfully linked to your WarriorPixel profile.`,
              type: 'system',
              read: false
            });
          }
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }
  }

  // If linking flow, redirect back to profile
  if (linking) {
    return NextResponse.redirect(`${origin}/profile?linked=${linking}`);
  }

  return NextResponse.redirect(`${origin}/`);
}
