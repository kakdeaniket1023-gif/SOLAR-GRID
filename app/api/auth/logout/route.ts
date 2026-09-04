import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Clear any residual legacy cookies
    response.cookies.delete('solargrid_session');
    response.cookies.delete('solargrid_role');

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Logout completed with warnings' }, { status: 200 });
  }
}
