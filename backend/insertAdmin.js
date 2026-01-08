const supabase = require("./supabaseClient");
const bcrypt = require("bcrypt");

(async () => {
  const hashedPassword = await bcrypt.hash("wisdom1jeremiah123", 10);

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        first_name: "Wisdom",
        last_name: "Jeremiah",
        email: "wisdomjeremiah57@gmail.com",
        password: hashedPassword,
        role: "admin",
      },
    ])
    .select(); // return inserted row

  if (error) {
    console.error("Insert admin user error:", error);
  } else {
    console.log("✅ Admin user inserted:", data);
  }
})();
