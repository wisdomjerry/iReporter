// src/pages/UserReports.jsx
import React, { useState } from "react";
import { useUsers } from "../contexts/UserContext";
import KanbanView from "../components/KanbanView";
import toast, { Toaster } from "react-hot-toast";

const UserReports = () => {
  const { currentUser } = useUsers();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!currentUser) return <p className="p-4">Loading user info...</p>;

  const handleEdit = (report) => {
    console.log("Edit report:", report);
  };

  const handleDelete = (reportId) => {
    // Live toast confirmation
    toast(
      (t) => (
        <div className="p-4">
          <p className="mb-2 font-medium text-gray-800">
            Are you sure you want to delete this report?
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              No
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  console.log("Deleting report with ID:", reportId);
                  // Call your delete function here, e.g.:
                  // await deleteReport(reportId);
                  setRefreshKey((prev) => prev + 1);
                  toast.success("Report deleted successfully", {
                    position: "top-center",
                    duration: 2500,
                  });
                } catch (err) {
                  console.error("Failed to delete report:", err);
                  toast.error("Failed to delete report", {
                    position: "top-center",
                    duration: 2500,
                  });
                }
              }}
              className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
            >
              Yes
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        duration: Infinity, // stays until user clicks
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        My Reports (Kanban View)
      </h1>

      <KanbanView
        role={currentUser.role}
        loggedInUserId={currentUser.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
        refreshKey={refreshKey}
      />
    </div>
  );
};

export default UserReports;
