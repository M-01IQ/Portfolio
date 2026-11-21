import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // Read the visit details sent from the browser.
    // userId is intentionally NOT read here: identity comes from the token below.
    const { accountType, sessionId, pagePath } = await req.json();
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // Fail early if the environment variables are missing
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'ENV missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user identity from the access token,
    // not from what the browser claims in the request body
    let validUserId: string | null = null;
    const token = req.headers.get('authorization')?.replace('Bearer ', '');

    if (token) {
      const { data } = await supabase.auth.getUser(token);
      validUserId = data.user?.id ?? null;
    }

    // Insert the visit record.
    // If the token was valid the visit is "registered", otherwise we
    // fall back to the type sent by the client (or "guest").
    const { error } = await supabase.from('analytics_log').insert([
      {
        user_id: validUserId,
        account_type: validUserId ? 'registered' : (accountType || 'guest'),
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
    // Any unexpected failure (bad JSON, network error, etc.)
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}