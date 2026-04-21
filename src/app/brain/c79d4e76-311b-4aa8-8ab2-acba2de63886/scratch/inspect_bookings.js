const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total bookings:', data.length);
  console.log('Sample bookings (statuses & dates):', data.map(b => ({ status: b.status, start_date: b.start_date })));
  
  const approved = data.filter(b => ['approved', 'confirmed'].includes(b.status));
  console.log('Approved/Confirmed bookings:', approved.length);
  
  const future = approved.filter(b => b.start_date >= '2026-04-18');
  console.log('Future approved bookings:', future.length);
}

checkBookings();
