import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, accountType, sessionId, pagePath } = body;
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'ENV missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let validUserId = null;

    if (userId && typeof userId === 'string' && userId !== 'guest') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        validUserId = userId;
      }
    }

    const { error } = await supabase
      .from('analytics_log')
      .insert([
        {
          user_id: validUserId,
          account_type: accountType || 'guest',
          session_id: sessionId || 'anon_session',
          page_path: pagePath || '/',
          user_agent: userAgent,
        },
      ]);

    if (error) {
      console.error('Analytics Insert Error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
