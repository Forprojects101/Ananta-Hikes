import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(url, key);

const email = "admin1@gmail.com";
const newPassword = "Password123!"; // User can change this later

async function reset() {
  console.log(`🔄 Resetting password for ${email}...`);
  
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(newPassword, salt);
  
  const { error } = await supabase
    .from("users")
    .update({ password_hash: hash })
    .eq("email", email);
    
  if (error) {
    console.error("❌ Reset failed:", error);
  } else {
    console.log("✅ Reset successful!");
    console.log(`New password is: ${newPassword}`);
  }
}

reset();
