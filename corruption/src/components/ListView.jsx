// src/components/ListView.jsx
import React, { useState, useEffect } from "react";
import { Trash2, SquarePen } from "lucide-react";
import moment from "moment";
import { useReports } from "../contexts/ReportContext";
import toast, { Toaster } from "react-hot-toast";

// --- Reusable Status Component ---
const StatusDisplay = ({ status, onChange }) => {
  const normalize = (s) => s?.toLowerCase().replace(/\s+/g, "-") || "pending";

  const normalized = normalize(status);

  const getStatusStyle = (status) => {
    switch (status) {
      case "pending":
        return {
          bg: "bg-pink-100",
          text: "text-pink-700",
          ring: "focus:ring-pink-300",
        };
      case "resolved":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          ring: "focus:ring-green-300",
        };
      case "rejected":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          ring: "focus:ring-red-300",
        };
      case "under-investigation":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          ring: "focus:ring-yellow-300",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          ring: "focus:ring-gray-300",
        };
    }
  };

  const style = getStatusStyle(normalized);

  const statuses = ["pending", "under-investigation", "resolved", "rejected"];

  if (onChange) {
    return (
      <select
        value={normalized}
        onChange={(e) => onChange(e.target.value)}
        className={`text-xs font-semibold rounded-full px-3 py-1 border focus:outline-none focus:ring-2 ${style.bg} ${style.text} ${style.ring} shadow-sm cursor-pointer`}
      >
        {statuses.map((status) => {
          const st = getStatusStyle(status);
          return (
            <option
              key={status}
              value={status}
              className={`${st.bg} ${st.text}`}
            >
              {status.charAt(0).toUpperCase() +
                status.slice(1).replace("-", " ")}
            </option>
          );
        })}
      </select>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${style.bg} ${style.text}`}
    >
      {normalized.charAt(0).toUpperCase() +
        normalized.slice(1).replace("-", " ")}
    </span>
  );
};

// --- ListView Component ---
const ListView = ({
  role,
  reports,
  setEditingReport,
  setShowModal,
  onDelete,
  refreshKey,
  onStatusChange,
  loading = false,
  currentUser,
}) => {
  const { reports: contextReports } = useReports();
  const displayReports = reports || contextReports || [];

  const [internalLoading, setInternalLoading] = useState(false);
  const [localReports, setLocalReports] = useState(displayReports);

  useEffect(() => {
    setLocalReports(displayReports);
  }, [displayReports]);

  useEffect(() => {
    const loadReports = async () => {
      setInternalLoading(true);
      setInternalLoading(false);
    };
    if (currentUser) loadReports();
  }, [currentUser, refreshKey]);

  // --- Delete Confirmation with Toast ---
  const handleDeleteWithToast = (reportId) => {
    toast(
      (t) => (
        <div className="bg-white border rounded-lg p-9 shadow-lg">
          <p className="mb-3 text-gray-800 font-medium">
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
                  await onDelete(reportId);
                  setLocalReports((prev) =>
                    prev.filter((r) => r.id !== reportId)
                  );
                  toast.success("Report deleted successfully", {
                    position: "top-center",
                    duration: 2500,
                  });
                } catch (err) {
                  console.error(err);
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
      { position: "top-center", duration: Infinity }
    );
  };

  // --- Status Change Handler ---
  const handleStatusChange = async (reportId, newStatus, userId) => {
    try {
      await onStatusChange(reportId, newStatus, userId);

      setLocalReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );

      toast.success(`Status updated to "${newStatus}"`);
    } catch (err) {
      console.error("ListView Status Update Error:", err);
      toast.error("Failed to update status");
    }
  };

  const tableHeaders =
    role === "admin"
      ? [
          { key: "title", label: "Title" },
          { key: "user", label: "User" },
          { key: "location", label: "Location" },
          { key: "type", label: "Type" },
          { key: "status", label: "Status" },
          { key: "date", label: "Date" },
        ]
      : [
          { key: "title", label: "Title" },
          { key: "location", label: "Location" },
          { key: "type", label: "Type" },
          { key: "status", label: "Status" },
          { key: "date", label: "Date" },
          { key: "actions", label: "Actions", align: "right" },
        ];

  const renderCell = (report, key) => {
    switch (key) {
      case "title":
        return report.title || "N/A";
      case "user":
        return (
          report.userName ||
          report.userEmail ||
          report.user?.name ||
          report.user?.email ||
          "Unknown User"
        );
      case "location":
        return report.location || "N/A";
      case "type":
        return report.type || "N/A";
      case "status":
        return (
          <StatusDisplay
            status={report.status}
            onChange={
              role === "admin"
                ? (newStatus) =>
                    handleStatusChange(report.id, newStatus, report.user?.id)
                : null
            }
          />
        );
      case "date":
        return moment(report.created_at || Date.now()).format("MMM D, YYYY");
      case "actions":
        return (
          <div className="text-right space-x-2">
            {role === "user" && report.status === "pending" && (
              <button
                onClick={() => {
                  setEditingReport(report);
                  setShowModal(true);
                }}
              >
                <SquarePen className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => handleDeleteWithToast(report.id)}
              className="text-red-400 hover:text-red-600 transition"
              title="Delete Report"
            >
              <Trash2 className="w-5 h-5 inline-block" />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const isLoading = internalLoading || loading;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[50vh]">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">All Reports</h2>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {tableHeaders.map((header) => (
                <th
                  key={header.key}
                  className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    header.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="text-center py-12 text-gray-500"
                >
                  Loading reports...
                </td>
              </tr>
            ) : localReports.length ? (
              localReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  {tableHeaders.map((header) => (
                    <td
                      key={header.key}
                      className={`px-3 py-4 text-sm ${
                        header.align === "right" ? "text-right" : ""
                      }`}
                    >
                      {renderCell(report, header.key)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={tableHeaders.length}
                  className="text-center py-12 text-gray-500"
                >
                  No reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <p className="text-center py-6 text-gray-500">Loading reports...</p>
        ) : localReports.length ? (
          localReports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-4 rounded-xl shadow border space-y-2"
            >
              <div className="flex justify-between">
                <span className="font-medium">Title:</span>
                <span>{report.title || "N/A"}</span>
              </div>
              {role === "admin" && (
                <div className="flex justify-between">
                  <span className="font-medium">User:</span>
                  <span>
                    {report.userName || report.user?.name || "Unknown User"}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium">Location:</span>
                <span>{report.location || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Type:</span>
                <span>{report.type || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <StatusDisplay
                  status={report.status}
                  onChange={
                    role === "admin"
                      ? (newStatus) =>
                          handleStatusChange(
                            report.id,
                            newStatus,
                            report.user?.id
                          )
                      : null
                  }
                />
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Created:</span>
                <span>
                  {moment(report.created_at || Date.now()).format(
                    "MMM D, YYYY"
                  )}
                </span>
              </div>
              {role !== "admin" && (
                <div className="flex justify-end space-x-2 pt-2">
                  {role === "user" && report.status === "pending" && (
                    <button
                      onClick={() => {
                        setEditingReport(report);
                        setShowModal(true);
                      }}
                    >
                      <SquarePen className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteWithToast(report.id)}
                    className="text-red-400 hover:text-red-600 transition"
                    title="Delete Report"
                  >
                    <Trash2 className="w-5 h-5 inline-block" />
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-center py-6 text-gray-500">No reports found.</p>
        )}
      </div>
    </div>
  );
};

export default ListView;
