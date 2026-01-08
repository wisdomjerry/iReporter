import React, { useState, useEffect } from "react";
import { useUsers } from "../contexts/UserContext";
import toast from "react-hot-toast";
import { FiUser, FiLock, FiUpload, FiEye, FiEyeOff } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const { currentUser, updateUserProfile, changePassword } = useUsers();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
    phone: "",
    avatar: null,
  });

  const [avatarPreview, setAvatarPreview] = useState("");
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load user data
  useEffect(() => {
    if (currentUser) {
      setProfile({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        bio: currentUser.bio || "",
        phone: currentUser.phone || "",
        avatar: null,
      });
      setAvatarPreview(currentUser.avatar || "");
    }
  }, [currentUser]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({ ...prev, avatar: file }));
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("firstName", profile.firstName);
      formData.append("lastName", profile.lastName);
      formData.append("bio", profile.bio);
      formData.append("phone", profile.phone);

      if (profile.avatar instanceof File) {
        formData.append("avatar", profile.avatar);
      }

      await updateUserProfile(formData);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile");
      console.error(err);
    }
  };

  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("New passwords do not match");
    }

    try {
      await changePassword(passwords.currentPassword, passwords.newPassword);
      toast.success("Password changed successfully!");
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error("Failed to change password");
    }
  };

  const handleBackToDashboard = () => {
    if (!currentUser) return;

    if (currentUser.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  // Tailwind (light-only)
  const inputClass =
    "mt-1 block w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const disabledInputClass =
    "mt-1 block w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-gray-100 text-gray-500 cursor-not-allowed";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";
  const cardClass =
    "bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-100";
  const primaryButtonClass =
    "w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 transition font-bold shadow-md hover:shadow-lg";

  return (
    <div className="min-h-screen sm:p-10 ">
      <div className="w-full p-4 pt-20">
        {/* Header & Back Button */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>

          <button
            onClick={handleBackToDashboard}
            className="px-4 py-2.5 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-semibold"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Profile Card */}
        <div className={`${cardClass} mb-8`}>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center">
            <FiUser className="w-6 h-6 mr-2 text-indigo-600" />
            Personal Information
          </h2>

          <div className="flex flex-col md:flex-row md:space-x-8">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6 md:mb-0">
              <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-indigo-500 shadow-xl">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-sm">
                    No Image
                  </div>
                )}
              </div>

              <label className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl cursor-pointer hover:bg-indigo-700 transition font-medium text-sm shadow-md">
                <FiUpload className="inline w-4 h-4 mr-1" />
                Change Avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            {/* Profile Form */}
            <form
              onSubmit={handleProfileSubmit}
              className="flex-grow space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleProfileChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleProfileChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email (Read-Only)</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className={disabledInputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Bio</label>
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleProfileChange}
                  rows={3}
                  className={inputClass}
                  placeholder="Tell us a little about yourself..."
                />
              </div>

              <button type="submit" className={primaryButtonClass}>
                Save Profile Updates
              </button>
            </form>
          </div>
        </div>

        {/* Password Card */}
        <div className={cardClass}>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center">
            <FiLock className="w-6 h-6 mr-2 text-green-600" />
            Security Settings
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {["currentPassword", "newPassword", "confirmPassword"].map(
                (field) => (
                  <div key={field} className="relative">
                    <label className={labelClass}>
                      {field === "currentPassword"
                        ? "Current Password"
                        : field === "newPassword"
                        ? "New Password"
                        : "Confirm New Password"}
                    </label>
                    <input
                      type={showPassword[field] ? "text" : "password"}
                      name={field}
                      value={passwords[field]}
                      onChange={(e) =>
                        setPasswords((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      className={`${inputClass} pr-10`} // add padding for icon
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field)}
                      className="absolute right-3 top-12 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword[field] ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition font-bold shadow-md hover:shadow-lg"
            >
              Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
