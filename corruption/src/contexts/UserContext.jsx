import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiService from "../services/api";

const UserContext = createContext();
export const useUsers = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showFirstLogin, setShowFirstLogin] = useState(false);

  // --- Helper: check if first login popup should show
  const checkFirstLogin = useCallback((user) => {
    setShowFirstLogin(user?.firstLoginShown === false);
  }, []);

  // --- Fetch current user
  const fetchCurrentUser = useCallback(async () => {
    try {
      const { user } = await apiService.getCurrentUser();
      setCurrentUser({
        ...user,
        avatar: user.avatar || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        role: user.role || "user",
      });
      checkFirstLogin(user);
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  }, [checkFirstLogin]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // --- Mark first login as seen
  const markFirstLoginSeen = useCallback(async (callback) => {
    if (!currentUser?.id) return;
    try {
      await apiService.markFirstLoginShown();
      setCurrentUser((prev) => ({ ...prev, firstLoginShown: true }));
      setShowFirstLogin(false);
      if (callback) callback();
    } catch (err) {
      console.error("Failed to mark first login as seen:", err);
      throw err;
    }
  }, [currentUser]);

  // --- Refresh user
  const refreshUser = useCallback(fetchCurrentUser, [fetchCurrentUser]);

  // --- Logout
  const logout = async () => {
    try {
      await apiService.logout();
      setCurrentUser(null);
      setShowFirstLogin(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // --- Profile actions
  const getProfile = async () => {
    try {
      return await apiService.getProfile();
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      throw err;
    }
  };

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

  const changePassword = async (currentPassword, newPassword) => {
    try {
      return await apiService.changePassword(currentPassword, newPassword);
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
