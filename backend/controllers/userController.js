// controllers/userController.js
const supabase = require("../supabaseClient");

// --- GET LOGGED-IN USER PROFILE ---
const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone, bio, avatar, role")
      .eq("id", req.user.id)
      .single();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone || "",
      bio: user.bio || "",
      avatar: user.avatar || "",
      role: user.role,
      firstLoginShown: user.firstLoginShown,
    });
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- GET ALL USERS (ADMIN ONLY) ---
const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone, bio, avatar, role");

    if (error) throw error;

    res.json(
      users.map((u) => ({
        id: u.id,
        firstName: u.first_name,
        lastName: u.last_name,
        email: u.email,
        phone: u.phone || "",
        bio: u.bio || "",
        avatar: u.avatar || "",
        role: u.role,
      }))
    );
  } catch (err) {
    console.error("GET ALL USERS ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// --- UPDATE PROFILE ---
const updateProfile = async (req, res) => {
  try {
    // Ensure req.user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { firstName, lastName, phone, bio } = req.body;

    // Build update object dynamically
    const updates = {};
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (req.file?.path) updates.avatar = req.file.path; // Already Cloudinary URL

    // Update user in Supabase
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      email: updatedUser.email,
      phone: updatedUser.phone || "",
      bio: updatedUser.bio || "",
      avatar: updatedUser.avatar || "",
      role: updatedUser.role,
    });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const markFirstLoginShown = async (req, res) => {
  try {
    const { error } = await supabase
      .from("users")
      .update({ firstLoginShown: true })
      .eq("id", req.user.id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error("MARK FIRST LOGIN ERROR:", err);
    res.status(500).json({ error: "Failed to update first login flag" });
  }
};

module.exports = {
  getProfile,
  getAllUsers,
  updateProfile,
  markFirstLoginShown,
};
