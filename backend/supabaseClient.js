// supabaseClient.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // use service_role here
);

module.exports = supabase;
