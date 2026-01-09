import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useReports } from "../contexts/ReportContext";
import ListView from "../components/ListView";
import KanbanView from "../components/KanbanView";
import ReportModal from "../components/ReportModal";

const statuses = ["pending", "under investigation", "resolved", "rejected"];
const COLOR_PRIMARY_PURPLE = "#4D2C5E";

const Reports = () => {
  const {
    currentUser,
    loading,
    reports,
    fetchDashboardData,
    createReport,
    updateReport,
    deleteReport,
  } = useReports();

  const [activeView, setActiveView] = useState("list");
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  const role = (
    currentUser?.role ||
    currentUser?.user?.role ||
    ""
  ).toLowerCase();

  if (!currentUser) {
    return (
      <div className="p-6 text-gray-600">
        Please log in to access your dashboard.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 pt-20 px-4">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ color: COLOR_PRIMARY_PURPLE }}
        >
          My Reports
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-700 shadow text-sm transition-all duration-200"
          >
            <Plus className="w-4 h-4" /> Add Report
          </button>

          <div className="flex gap-2 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setActiveView("list")}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                activeView === "list"
                  ? "bg-white shadow text-red-600"
                  : "text-gray-600 hover:text-teal-600"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setActiveView("kanban")}
              className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                activeView === "kanban"
                  ? "bg-white shadow text-red-600"
                  : "text-gray-600 hover:text-teal-600"
              }`}
            >
              Kanban
            </button>
          </div>
        </div>
      </div>

      {/* Render ListView or Kanban */}
      {reports.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No reports found.</p>
      ) : activeView === "list" ? (
        <ListView
          reports={reports}
          role={role}  
          setEditingReport={setEditingReport}
          setShowModal={setShowModal} 
          onDelete={deleteReport}
        />
      ) : (
        <KanbanView
          reports={reports}
          statuses={statuses}
          role={role}
          onEdit={setEditingReport}
          onDelete={deleteReport}
        />
      )}

      <ReportModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        editingReport={editingReport}
        handleSubmit={createReport}
      />
    </div>
  );
};

export default Reports;