// supabaseClient.js

const { createClient } = require("@supabase/supabase-js");

console.log("ENV CHECK", {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // use service_role here
);

module.exports = supabase;
