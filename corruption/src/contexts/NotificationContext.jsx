import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiService from "../services/api";
import { useUsers } from "../contexts/UserContext";

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useUsers();
  const [notifications, setNotifications] = useState([]);

  // --- Fetch notifications ---
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await apiService.getNotifications(); // returns array
      const sorted = (data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setNotifications(sorted);
    } catch (err) {
      console.error("Fetch notifications error:", err);
      setNotifications([]);
    }
  }, []);

  // --- Add notification ---
  const addNotification = async (notification) => {
    try {
      await apiService.createNotification(notification);
      await fetchNotifications();
    } catch (err) {
      console.error("Add notification error:", err);
    }
  };

  // --- Mark one as read ---
  const markAsRead = async (id) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("Mark notification read error:", err);
    }
  };

  // --- Mark all as read ---
  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error("Mark all notifications read error:", err);
    }
  };

  // --- Delete notification ---
  const deleteNotification = async (id) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  // --- Delete all ---
  const deleteAllNotifications = async () => {
    try {
      await Promise.all(notifications.map((n) => deleteNotification(n.id)));
      setNotifications([]);
    } catch (err) {
      console.error("Delete all notifications error:", err);
      throw err;
    }
  };

  // --- Load notifications after currentUser is ready ---
  useEffect(() => {
    if (currentUser) fetchNotifications();
  }, [currentUser, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
