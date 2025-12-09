import React, { useEffect, useState } from "react";
import { useReports } from "../contexts/ReportContext";
import ListView from "../components/ListView";
import KanbanView from "../components/KanbanView";

const AdminReports = () => {
  const { reports, fetchDashboardData, deleteReport, updateReportStatus  } = useReports();
  const [activeView, setActiveView] = useState("list");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDashboardData(); // just fetch in background
  }, [fetchDashboardData, refreshKey]);

  const handleDelete = async (id) => {
    await deleteReport(id);
    setRefreshKey((prev) => prev + 1);
  };

  const handleStatusUpdate = async (reportId, newStatus, userId) => {
    try {
      await updateReportStatus(reportId, newStatus);
      fetchDashboardData();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">All Reports (Admin)</h1>

        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded ${
              activeView === "list"
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveView("list")}
          >
            List View
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeView === "kanban"
                ? "bg-red-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
            onClick={() => setActiveView("kanban")}
          >
            Kanban View
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No reports available.
        </p>
      ) : activeView === "list" ? (
        <ListView role="admin" refreshKey={refreshKey} onStatusChange={handleStatusUpdate} />
      ) : (
        <KanbanView
          role="admin"
          loggedInUserId={null}
          onEdit={() => {}}
          onDelete={handleDelete}
          refreshKey={refreshKey}
        />
      )}
    </div>
  );
};

export default AdminReports;
