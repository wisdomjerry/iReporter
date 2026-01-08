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
        (list || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )
      );
    } catch (err) {
      console.error("❌ Fetch notifications error:", err);
    }
  }, [currentUser?.id]);

  // ✅ Initialize socket once
  useEffect(() => {
    if (!currentUser?.id) return;

    const userId = String(currentUser.id);

    if (!socket.connected) {
      socket.safeConnect();
    }

    const handleConnect = () => {
      console.log("🔌 Socket connected:", socket.id);
      socket.emit("register", userId);
      console.log(`🟢 User ${userId} registered on server`);
    };

    const handleError = (err) => {
      console.error("❌ Socket connection error:", err.message);
    };

    const handleNotification = (payload) => {
      console.log("📩 New notification received:", payload);

      // Update state
      setNotifications((prev) => [payload, ...prev]);

      // Update reports in real-time
      if (payload?.type === "status-update" && payload?.report) {
        updateReportRealtime(payload.report);
      }

      // Show toast
      toast.custom(() => (
        <div className="bg-white p-4 rounded-xl shadow border">
          <p className="font-semibold">Notification</p>
          <p className="text-sm text-gray-600">{payload.message}</p>
        </div>
      ));

      // Optional DB sync
      setTimeout(fetchNotifications, 800);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);
    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
      socket.off("notification:new", handleNotification);
      // We DON'T disconnect here; keeps socket alive for user session
    };
  }, [currentUser?.id, fetchNotifications, updateReportRealtime]);

  // Fetch notifications on mount
  useEffect(() => {
    if (currentUser?.id) fetchNotifications();
  }, [currentUser?.id, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error("❌ Mark as read error:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead(); // you need an API endpoint for this
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("❌ Mark all as read error:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
