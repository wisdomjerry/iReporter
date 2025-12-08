import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import apiService from "../services/api";
import { useAuth } from "./AuthContext";

const UserContext = createContext();
export const useUsers = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showFirstLogin, setShowFirstLogin] = useState(false);
  const { user } = useAuth();

  // Check if first login popup should show
  const checkFirstLogin = (user) => {
    setShowFirstLogin(!user.firstLoginShown);
  };

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiService.getCurrentUser();
        const u = data.user;
        setCurrentUser({
          ...u,
          avatar: u.avatar || "",
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phone: u.phone || "",
          role: u.role || "user",
        });
        checkFirstLogin(u);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };
    fetchUser();
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiService.getCurrentUser();
      const u = data.user;
      setCurrentUser({
        ...u,
        avatar: u.avatar || "",
      });
      checkFirstLogin(u);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  // Mark first login as seen
  const markFirstLoginSeen = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      await apiService.markFirstLoginShown();
      setCurrentUser((prev) => ({ ...prev, firstLoginShown: true }));
      setShowFirstLogin(false);
    } catch (err) {
      console.error("Failed to mark first login as seen:", err);
    }
  }, [currentUser]);

  // Logout
  const logout = async () => {
    try {
      await apiService.logout();
      setCurrentUser(null);
      setShowFirstLogin(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Get full profile
  const getProfile = async () => {
    try {
      const data = await apiService.getProfile();
      return data;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      throw err;
    }
  };

  // Update user profile (name, phone, bio, avatar)
  const updateUserProfile = async (formData) => {
    try {
      const updatedUser = await apiService.updateProfile(formData);
      setCurrentUser({
        ...updatedUser,
        avatar: updatedUser.avatar || "",
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        phone: updatedUser.phone || "",
        role: updatedUser.role || "user",
      });
      return updatedUser;
    } catch (err) {
      console.error("Profile update error:", err);
      throw err;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const data = await apiService.changePassword(
        currentPassword,
        newPassword
      );
      return data;
    } catch (err) {
      console.error("Failed to change password:", err);
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        refreshUser,
        logout,
        showFirstLogin,
        markFirstLoginSeen,
        getProfile,
        updateUserProfile,
        changePassword,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
