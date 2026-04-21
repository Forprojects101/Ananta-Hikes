import { createClient } from "@supabase/supabase-js";
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

const { data, error } = await supabase
  .from("users")
  .select("id, email, password_hash")
  .eq("email", email)
  .single();

if (error) {
  console.error("Error fetching user:", error);
} else {
  console.log("User details:", data);
  if (data.password_hash) {
    console.log("Hash length:", data.password_hash.length);
    console.log("Hash starts with:", data.password_hash.substring(0, 10));
  } else {
    console.log("No password hash found.");
  }
}
