import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { superAdminId, superAdminPassword } = await request.json();
    const supabase = createRouteHandlerClient({ cookies });

    const { data, error } = await supabase
      .from('super_admin_whitelist')
      .select('*')
      .eq('super_admin_id', superAdminId)
      .eq('super_admin_password', superAdminPassword)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
