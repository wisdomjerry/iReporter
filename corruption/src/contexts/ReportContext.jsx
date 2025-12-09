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

  const [shouldShowFirstLoginPopup, setShouldShowFirstLoginPopup] = useState(false);

  const normalizeType = (type) => type?.toLowerCase().replace(/\s+/g, "-") || "";
  const normalizeStatus = (status) => status?.toLowerCase().replace(/\s+/g, "-") || "pending";

  // ────────────────────────────────
  // FETCH DASHBOARD DATA SAFELY
  // ────────────────────────────────
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      const reportsPromise =
        currentUser.role === "admin"
          ? apiService.getReports()
          : apiService.getUserReports();

      const notificationsPromise = apiService.getNotifications();

      const [reportsDataRaw, notificationsDataRaw] = await Promise.all([
        reportsPromise,
        notificationsPromise,
      ]);

      // Ensure arrays
      const reportsData = Array.isArray(reportsDataRaw)
        ? reportsDataRaw
        : reportsDataRaw?.reports || [];
      const notificationsData = Array.isArray(notificationsDataRaw)
        ? notificationsDataRaw
        : notificationsDataRaw?.notifications || [];

      // Format reports
      const formattedReports = reportsData.map((r) => ({
        ...r,
        type: normalizeType(r.type),
        status: normalizeStatus(r.status),
        lat: r.lat ? Number(r.lat) : null,
        lng: r.lng ? Number(r.lng) : null,
      }));

      setReports(formattedReports);
      setNotifications(notificationsData);

      // Set locations
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
      if (currentUser.firstLoginShown === undefined && reportsDataRaw?.firstLoginShown !== undefined) {
        setCurrentUser((prev) => ({ ...prev, firstLoginShown: reportsDataRaw.firstLoginShown }));
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

  // ────────────────────────────────
  // SHOW POPUP AT LOGIN
  // ────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    if (!currentUser.firstLoginShown) {
      setShouldShowFirstLoginPopup(true);
    }

    fetchDashboardData();
  }, [currentUser, fetchDashboardData]);

  // ────────────────────────────────
  // CREATE REPORT
  // ────────────────────────────────
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
      setLocations((prev) => [...prev, { ...tempReport }]);
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

      setReports((prev) =>
        (prev || []).map((r) => (r.id === tempId ? formattedReport : r))
      );
      if (formattedReport.lat && formattedReport.lng) {
        setLocations((prev) =>
          (prev || []).map((l) =>
            l.id === tempId
              ? { ...formattedReport }
              : l
          )
        );
      }

      // MARK FIRST LOGIN
      if (!currentUser.firstLoginShown) {
        await apiService.markFirstLoginShown();
        setCurrentUser((p) => ({ ...p, firstLoginShown: true }));
        setShouldShowFirstLoginPopup(false);
      }

      return formattedReport;
    } catch (err) {
      console.error("Error creating report:", err);
      // rollback
      setReports((prev) => (prev || []).filter((r) => !r.id.toString().startsWith("temp-")));
      setLocations((prev) => (prev || []).filter((l) => !l.id.toString().startsWith("temp-")));
      throw err;
    }
  };

  // ────────────────────────────────
  // UPDATE REPORT
  // ────────────────────────────────
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

  // ────────────────────────────────
  // DELETE REPORT
  // ────────────────────────────────
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

  // ────────────────────────────────
  // UPDATE STATUS
  // ────────────────────────────────
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
