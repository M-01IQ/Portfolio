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
    const validUserId = (userId && userId !== 'guest' && userId !== '') ? userId : null;

    // تنفيذ الإدخال دون الحاجة لجلب البيانات المدخلة (.select) لتسريع العملية
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
      // إرجاع الخطأ فقط في حال فشل الإدخال
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // عند النجاح، نرجع استجابة فارغة أو مؤشر بسيط بدون تفاصيل
    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
