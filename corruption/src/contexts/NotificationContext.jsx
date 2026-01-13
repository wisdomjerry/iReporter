import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import apiService from "../services/api";
import socket from "../services/socket";
import { useUsers } from "./UserContext";
import { useReports } from "./ReportContext";
import toast from "react-hot-toast";

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useUsers();
  const { updateReportRealtime } = useReports();
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const list = await apiService.getNotifications();
      setNotifications(
        (list || [])
          .filter((n) => String(n.user_id) === String(currentUser.id))
          .map((n) => ({ ...n, is_read: !!n.is_read }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
    } catch (err) {
      console.error("❌ Fetch notifications error:", err);
    }
  }, [currentUser?.id]);

  // Socket setup
  useEffect(() => {
    if (!currentUser?.id) return;
    const userId = String(currentUser.id);

    if (!socket.connected) socket.safeConnect();

    const handleConnect = () => {
      socket.emit("register", userId);
    };

    const handleError = (err) => console.error("❌ Socket error:", err.message);

    const handleNotification = (payload) => {
      if (String(payload.user_id) !== String(currentUser.id)) return;

      // Normalize is_read
      const notification = { ...payload, is_read: !!payload.is_read };

      // Add to state
      setNotifications((prev) => [notification, ...prev]);

      // ----- REAL-TIME REPORT UPDATE -----
      // Update the report immediately if included in notification
      if (notification.report) {
        updateReportRealtime(notification.report);
      }

      // Show toast
      toast.custom(() => (
        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="font-semibold">Notification</p>
          <p className="text-sm text-gray-600">{notification.message}</p>
        </div>
      ));
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);
    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
      socket.off("notification:new", handleNotification);
    };
  }, [currentUser?.id, updateReportRealtime]);

  // Fetch on mount
  useEffect(() => {
    if (currentUser?.id) fetchNotifications();
  }, [currentUser?.id, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("❌ Mark as read error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("❌ Mark all as read error:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await apiService.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("❌ Delete notification error:", err);
      throw err;
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await apiService.delete("/notifications");
      setNotifications([]);
    } catch (err) {
      console.error("❌ Delete all notifications error:", err);
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
