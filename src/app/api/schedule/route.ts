import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        hike_type,
        start_date,
        end_date,
        participants,
        status,
        total_price,
        guide_fee,
        skill_level,
        mountain_id (
          id,
          name,
          image_url,
          location
        )
      `)
      .eq('status', 'approved')
      .gte('start_date', new Date().toISOString().split('T')[0])
      .order('start_date', { ascending: true });

    if (error) {
      console.error('API Schedule Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API Schedule Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
