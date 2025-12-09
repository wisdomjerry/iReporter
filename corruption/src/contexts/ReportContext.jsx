import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiService from "../services/api";
import { useUsers } from "./UserContext";
import toast from "react-hot-toast";

const ReportContext = createContext();
export const useReports = () => useContext(ReportContext);

export const ReportProvider = ({ children }) => {
  const { currentUser, setCurrentUser } = useUsers();

  const [reports, setReports] = useState([]);
  const [locations, setLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // New improved system
  const [shouldShowFirstLoginPopup, setShouldShowFirstLoginPopup] = useState(false);

  const normalizeType = (type) => type?.toLowerCase().replace(/\s+/g, "-") || "";
  const normalizeStatus = (status) => status?.toLowerCase().replace(/\s+/g, "-") || "pending";

  // ────────────────────────────────────────────────────────────
  // FETCH DASHBOARD DATA
  // ────────────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const reportsPromise =
        currentUser.role === "admin"
          ? apiService.getReports()
          : apiService.getUserReports();

      const notificationsPromise = apiService.getNotifications();

      const [reportsData, notificationsData] = await Promise.all([
        reportsPromise,
        notificationsPromise,
      ]);

      const formattedReports = (reportsData || []).map((r) => ({
        ...r,
        type: normalizeType(r.type),
        status: normalizeStatus(r.status),
        lat: r.lat ? Number(r.lat) : null,
        lng: r.lng ? Number(r.lng) : null,
      }));

      setReports(formattedReports);
      setNotifications(notificationsData || []);

      // Update locations
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

      // Update firstLoginShown if backend provides it
      if (
        currentUser.firstLoginShown === undefined &&
        reportsData.firstLoginShown !== undefined
      ) {
        setCurrentUser((prev) => ({
          ...prev,
          firstLoginShown: reportsData.firstLoginShown,
        }));
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setReports([]);
      setLocations([]);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, setCurrentUser]);

  // ────────────────────────────────────────────────────────────
  // SHOW POPUP IMMEDIATELY AT LOGIN
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    // Show instantly before API call
    if (!currentUser.firstLoginShown) {
      setShouldShowFirstLoginPopup(true);
    }

    fetchDashboardData();
  }, [currentUser, fetchDashboardData]);

  // ────────────────────────────────────────────────────────────
  // CREATE REPORT
  // ────────────────────────────────────────────────────────────
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

      // Fix location update
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

      // FIRST LOGIN FIX
      if (!currentUser.firstLoginShown) {
        try {
          await apiService.markFirstLoginShown();
          setCurrentUser((p) => ({ ...p, firstLoginShown: true }));
        } catch (err) {
          console.error("Failed to mark first login:", err);
        }
      }

      // hide popup forever
      setShouldShowFirstLoginPopup(false);

      return formattedReport;
    } catch (err) {
      console.error("Error creating report:", err);

      // Rollback
      setReports((prev) =>
        (prev || []).filter((r) => !r.id.toString().startsWith("temp-"))
      );
      setLocations((prev) =>
        (prev || []).filter((l) => !l.id.toString().startsWith("temp-"))
      );

      throw err;
    }
  };

  // ────────────────────────────────────────────────────────────
  // UPDATE REPORT
  // ────────────────────────────────────────────────────────────
  const updateReport = async (reportId, reportData) => {
    const oldReport = reports.find((r) => r.id === reportId);
    if (!oldReport) return null;

    try {
      const updatedReport = { ...oldReport, ...reportData };

      setReports((prev) =>
        (prev || []).map((r) => (r.id === reportId ? updatedReport : r))
      );

      const savedReport = await apiService.put(`/reports/${reportId}`, reportData);

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

      return formattedReport;
    } catch (err) {
      console.error("Update report error:", err);
      toast.error("Failed to update report");
      return null;
    }
  };

  // ────────────────────────────────────────────────────────────
  // DELETE REPORT
  // ────────────────────────────────────────────────────────────
  const deleteReport = async (reportId) => {
    const oldReports = [...reports];

    try {
      setReports((prev) => (prev || []).filter((r) => r.id !== reportId));
      await apiService.delete(`/reports/${reportId}`);
      toast.success("Report deleted");
    } catch (err) {
      console.error("Delete report error:", err);
      toast.error("Failed");
      setReports(oldReports);
    }
  };

  // ────────────────────────────────────────────────────────────
  // UPDATE STATUS
  // ────────────────────────────────────────────────────────────
  const updateReportStatus = async (reportId, status) => {
    const oldReport = reports.find((r) => r.id === reportId);
    if (!oldReport) return null;

    try {
      setReports((prev) =>
        (prev || []).map((r) => (r.id === reportId ? { ...r, status } : r))
      );

      await apiService.put(`/reports/${reportId}/status`, { status });

      return { ...oldReport, status };
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Failed to update status");
      return null;
    }
  };

  // ────────────────────────────────────────────────────────────
  // PROVIDER EXPORT
  // ────────────────────────────────────────────────────────────
  return (
    <ReportContext.Provider
      value={{
        currentUser,
        reports,
        locations,
        notifications,
        loading,

        shouldShowFirstLoginPopup,
        setShouldShowFirstLoginPopup,

        fetchDashboardData,
        createReport,
        updateReport,
        deleteReport,
        updateReportStatus,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};
