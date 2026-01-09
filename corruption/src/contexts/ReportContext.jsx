import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import apiService from "../services/api";
import { useUsers } from "./UserContext";
import toast from "react-hot-toast";
import socket from "../services/socket";

const ReportContext = createContext();
export const useReports = () => useContext(ReportContext);
export const ReportProvider = ({ children }) => {
  const { currentUser } = useUsers();
  const [reports, setReports] = useState([]);
  const [locations, setLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCreatedFirstReport, setHasCreatedFirstReport] = useState(false);
  const normalizeType = (type) =>
    type?.toLowerCase().replace(/\s+/g, "-") || "";
  const normalizeStatus = (status) =>
    status?.toLowerCase().replace(/\s+/g, "-") || "pending";
  // ─── FETCH DASHBOARD DATA ───
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const reportsPromise =
        currentUser.role === "admin"
          ? apiService.getReports()
          : apiService.getReports(currentUser.id);
      const notificationsPromise = apiService.getNotifications();
      const [reportsData, notificationsData] = await Promise.all([
        reportsPromise,
        notificationsPromise,
      ]);
      const reportsArray = Array.isArray(reportsData)
        ? reportsData
        : reportsData?.reports || reportsData?.data || [];
      const formattedReports = reportsArray.map((r) => ({
        ...r,
        type: normalizeType(r.type),
        status: normalizeStatus(r.status),
        lat: r.lat ? Number(r.lat) : null,
        lng: r.lng ? Number(r.lng) : null,
      }));
      setReports(formattedReports);
      setLocations(
        formattedReports
          .filter((r) => r.lat && r.lng)
          .map((r) => ({
            id: r.id,
            lat: r.lat,
            lng: r.lng,
            title: r.title,
            type: r.type,
            status: r.status,
          }))
      );
      setNotifications(notificationsData || []);
      if (formattedReports.length > 0) setHasCreatedFirstReport(true);
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setReports([]);
      setLocations([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  useEffect(() => {
    if (currentUser) fetchDashboardData();
  }, [currentUser, fetchDashboardData]);
  // ─── CREATE REPORT ───
  const createReport = async (data) => {
    if (!data.title || !data.description || !data.type) {
      throw new Error("Title, description, and type are required");
    }
    const tempId = `temp-${Date.now()}`;
    const tempReport = {
      id: tempId,
      title: data.title,
      description: data.description,
      location: data.location || "",
      type: normalizeType(data.type),
      status: "pending",
      lat: data.lat ? Number(data.lat) : null,
      lng: data.lng ? Number(data.lng) : null,
      media: data.media || [],
    };
    // Optimistic UI
    setReports((prev) => [tempReport, ...(prev || [])]);
    if (tempReport.lat && tempReport.lng) {
      setLocations((prev) => [
        ...prev,
        {
          id: tempReport.id,
          title: tempReport.title,
          type: tempReport.type,
          status: tempReport.status,
          lat: tempReport.lat,
          lng: tempReport.lng,
        },
      ]);
    }
    try {
      const response = await apiService.post("/reports", data);
      const savedReport = response.report;
      if (!savedReport?.id) throw new Error("Invalid backend response");
      const formattedReport = {
        id: savedReport.id,
        title: savedReport.title || "",
        description: savedReport.description || "",
        location: savedReport.location || "",
        type: normalizeType(savedReport.type),
        status: normalizeStatus(savedReport.status),
        lat: savedReport.lat ? Number(savedReport.lat) : null,
        lng: savedReport.lng ? Number(savedReport.lng) : null,
        media: savedReport.media || [],
      };
      // Replace temp report
      setReports((prev) =>
        (prev || []).map((r) => (r.id === tempId ? formattedReport : r))
      );
      if (formattedReport.lat && formattedReport.lng) {
        setLocations((prev) =>
          (prev || []).map((l) =>
            l.id === tempId
              ? {
                  id: formattedReport.id,
                  title: formattedReport.title,
                  type: formattedReport.type,
                  status: formattedReport.status,
                  lat: formattedReport.lat,
                  lng: formattedReport.lng,
                }
              : l
          )
        );
      }
      setHasCreatedFirstReport(true);
      return formattedReport;
    } catch (err) {
      console.error("Error creating report:", err);
      // Rollback temp report
      setReports((prev) =>
        (prev || []).filter((r) => !r.id.toString().startsWith("temp-"))
      );
      setLocations((prev) =>
        (prev || []).filter((l) => !l.id.toString().startsWith("temp-"))
      );
      throw err;
    }
  };
  // ─── UPDATE REPORT ───
  const updateReport = async (reportId, reportData) => {
    const oldReport = reports.find((r) => r.id === reportId);
    if (!oldReport) return null;
    try {
      const updatedReport = { ...oldReport, ...reportData };
      setReports((prev) =>
        (prev || []).map((r) => (r.id === reportId ? updatedReport : r))
      );
      if (updatedReport.lat && updatedReport.lng) {
        setLocations((prev) =>
          (prev || []).map((l) =>
            l.id === reportId ? { ...l, ...updatedReport } : l
          )
        );
      }
      const savedReport = await apiService.put(
        `/reports/${reportId}`,
        reportData
      );
      const formattedReport = {
        ...savedReport,
        type: normalizeType(savedReport.type),
        status: normalizeStatus(savedReport.status),
        lat: savedReport.lat ? Number(savedReport.lat) : null,
        lng: savedReport.lng ? Number(savedReport.lng) : null,
      };
      setReports((prev) =>
        (prev || []).map((r) => (r.id === reportId ? formattedReport : r))
      );
      if (formattedReport.lat && formattedReport.lng) {
        setLocations((prev) =>
          (prev || []).map((l) =>
            l.id === reportId ? { ...l, ...formattedReport } : l
          )
        );
      }
      return formattedReport;
    } catch (err) {
      console.error("Update report error:", err);
      toast.error("Failed to update report");
      setReports((prev) =>
        (prev || []).map((r) => (r.id === reportId ? oldReport : r))
      );
      return null;
    }
  };
  // ─── DELETE REPORT ───
  const deleteReport = async (reportId) => {
    const oldReports = [...reports];
    const oldLocations = [...locations];
    try {
      setReports((prev) => (prev || []).filter((r) => r.id !== reportId));
      setLocations((prev) => (prev || []).filter((l) => l.id !== reportId));
      await apiService.delete(`/reports/${reportId}`);
      toast.success("Report deleted successfully");
    } catch (err) {
      console.error("Delete report error:", err);
      toast.error("Failed to delete report");
      setReports(oldReports);
      setLocations(oldLocations);
    }
  };
  // ─── UPDATE REPORT STATUS ───
  const updateReportStatus = async (reportId, status) => {
    const oldReport = reports.find((r) => r.id === reportId);
    if (!oldReport) return null;
    try {
      // Optimistic update
      setReports((prev) =>
        (prev || []).map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      setLocations((prev) =>
        (prev || []).map((l) => (l.id === reportId ? { ...l, status } : l))
      );
      await apiService.put(`/reports/${reportId}/status`, { status });
      return { ...oldReport, status };
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Failed to update status");
      setReports((prev) =>
        (prev || []).map((r) => (r.id === reportId ? oldReport : r))
      );
      return null;
    }
  };

  // ─── REAL-TIME REPORT UPDATE (FROM SOCKET) ───
  const updateReportRealtime = (incomingReport) => {
    if (!incomingReport?.id) return;

    const formattedReport = {
      ...incomingReport,
      type: normalizeType(incomingReport.type),
      status: normalizeStatus(incomingReport.status),
      lat: incomingReport.lat ? Number(incomingReport.lat) : null,
      lng: incomingReport.lng ? Number(incomingReport.lng) : null,
    };

    setReports((prev) => {
      const exists = prev.find((r) => r.id === formattedReport.id);
      if (exists) {
        // Update existing
        return prev.map((r) =>
          r.id === formattedReport.id ? { ...r, ...formattedReport } : r
        );
      } else {
        // Add new report if it doesn't exist
        return [formattedReport, ...prev];
      }
    });

    setLocations((prev) => {
      const exists = prev.find((l) => l.id === formattedReport.id);
      if (exists) {
        return prev.map((l) =>
          l.id === formattedReport.id ? { ...l, ...formattedReport } : l
        );
      } else if (formattedReport.lat && formattedReport.lng) {
        return [
          ...prev,
          {
            id: formattedReport.id,
            title: formattedReport.title,
            type: formattedReport.type,
            status: formattedReport.status,
            lat: formattedReport.lat,
            lng: formattedReport.lng,
          },
        ];
      } else return prev;
    });
  };

  // ─── SOCKET REAL-TIME REPORT LISTENER ───
  useEffect(() => {
    if (!currentUser?.id) return;

    if (!socket.connected) socket.safeConnect();

    const handleReportUpdate = (payload) => {
      console.log("🟢 Real-time report update received:", payload);
      updateReportRealtime(payload);
    };

    socket.on("report:updated", handleReportUpdate);

    return () => {
      socket.off("report:updated", handleReportUpdate);
    };
  }, [currentUser?.id]);

  // ─── DERIVED REAL-TIME STATS ───
  const stats = useMemo(() => {
    return {
      resolved: reports.filter((r) => r.status === "resolved").length,
      rejected: reports.filter((r) => r.status === "rejected").length,
      pending: reports.filter((r) => r.status === "pending").length,
      underInvestigation: reports.filter((r) =>
        ["under-investigation", "under investigation"].includes(
          r.status?.toLowerCase()
        )
      ).length,
      redFlags: reports.filter((r) => r.type === "red-flag").length,
      interventions: reports.filter((r) => r.type === "intervention").length,
    };
  }, [reports]);

  // ─── DERIVED REAL-TIME RECENT REPORTS ───
  const recentReports = useMemo(() => {
    return [...reports].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }, [reports]);

  return (
    <ReportContext.Provider
      value={{
        currentUser,
        reports,
        locations,
        notifications,
        loading,
        hasCreatedFirstReport,
        fetchDashboardData,
        createReport,
        updateReport,
        deleteReport,
        updateReportStatus,
        updateReportRealtime,
        stats,
        recentReports,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};
