const { createClient } = require('@supabase/supabase-client');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('group_photos')
    .select('*');
  
  if (error) {
    console.error('Error fetching group_photos:', error);
  } else {
    console.log('Group Photos count:', data.length);
    console.log('Sample data:', data[0]);
  }
}

checkData();
