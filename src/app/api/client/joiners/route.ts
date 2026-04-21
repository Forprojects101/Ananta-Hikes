import { createClient } from '@supabase/supabase-js';
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query joiner requests with mountain and booking details
    let query = supabase
      .from('joiner')
      .select(`
        *,
        bookings:booking_id (
          start_date,
          hike_type,
          mountains:mountain_id (
            name,
            image_url,
            location
          )
        )
      `);

    if (userId) {
      query = query.eq('hiker_id', userId);
    } else {
      query = query.eq('email', userEmail);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('API Joiners Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data for easier consumption
    const transformedData = data.map((item: any) => {
      const booking = Array.isArray(item.bookings) ? item.bookings[0] : item.bookings;
      const mountain = booking?.mountains ? (Array.isArray(booking.mountains) ? booking.mountains[0] : booking.mountains) : null;

      return {
        id: item.id,
        bookingId: item.booking_id,
        mountainName: mountain?.name || 'Mountain',
        mountainImage: mountain?.image_url,
        mountainLocation: mountain?.location,
        startDate: booking?.start_date,
        hikeType: booking?.hike_type,
        participants: item.participants,
        totalPrice: item.total_price,
        status: item.status,
        createdAt: item.created_at,
        skillLevel: item.skill_level,
        addOns: item.add_ons
      };
    });

    return NextResponse.json({ joiners: transformedData });
  } catch (err) {
    console.error('API Joiners Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
