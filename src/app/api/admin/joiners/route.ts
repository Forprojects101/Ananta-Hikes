import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('joiner')
      .select(`
        *,
        bookings (
          id,
          start_date,
          mountains:mountain_id (
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ joiners: data });
  } catch (err) {
    console.error('Admin Joiners Fetch Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
