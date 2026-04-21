const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedBookings() {
  // Get a hiker and a mountain first
  const { data: hiker } = await supabase.from('users').select('id').eq('email', 'jessonmondejar1@gmail.com').single();
  const { data: mountains } = await supabase.from('mountains').select('id, name').limit(3);

  if (!hiker || !mountains || mountains.length === 0) {
    console.error('Could not find hiker or mountains');
    return;
  }

  const testBookings = [
    {
      hiker_id: hiker.id,
      mountain_id: mountains[0].id,
      hike_type: 'Day',
      start_date: '2026-05-10',
      end_date: '2026-05-10',
      participants: 5,
      total_price: 2500.00,
      status: 'confirmed',
      skill_level: 'Beginner',
      notes: 'Test Booking 1'
    },
    {
      hiker_id: hiker.id,
      mountain_id: mountains[1]?.id || mountains[0].id,
      hike_type: 'Overnight',
      start_date: '2026-05-20',
      end_date: '2026-05-21',
      participants: 8,
      total_price: 4500.00,
      status: 'approved',
      skill_level: 'Intermediate',
      notes: 'Test Booking 2'
    }
  ];

  const { error } = await supabase.from('bookings').insert(testBookings);
  if (error) {
    console.error('Seed Error:', error);
  } else {
    console.log('Successfully seeded 2 bookings!');
  }
}

seedBookings();
