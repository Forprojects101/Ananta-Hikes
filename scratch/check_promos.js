
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPromotions() {
  const { data, error } = await supabase
    .from("promotions")
    .select("*");
  
  if (error) {
    console.error("Error fetching promotions:", error);
  } else {
    console.log("Promotions found:", JSON.stringify(data, null, 2));
  }
}

checkPromotions();
