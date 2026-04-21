import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { 
      booking_id, 
      hiker_id, 
      full_name, 
      email, 
      phone, 
      participants, 
      notes,
      skill_level,
      add_ons,
      total_price
    } = body;

    const { data, error } = await supabase
      .from('joiner')
      .insert([
        {
          booking_id,
          hiker_id,
          full_name,
          email,
          phone,
          participants,
          notes,
          skill_level,
          add_ons,
          total_price,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Join Expedition Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Join Expedition Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
