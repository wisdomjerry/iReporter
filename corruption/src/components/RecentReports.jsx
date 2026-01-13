import React from "react";

const STATUS_OPTIONS = {
  pending: "pending",
  "under-investigation": "under-investigation",
  resolved: "resolved",
  rejected: "rejected",
};

const RecentReports = ({ reports = [], onEditReport, onStatusUpdate }) => {
  const safeReports = Array.isArray(reports)
    ? reports.filter((r) => r && typeof r === "object")
    : [];
  const recent = safeReports.slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="text-gray-500 text-center p-6 bg-gray-50 rounded border border-gray-200">
        No recent reports.
      </div>
    );
  }

  const normalizeReport = (report) => ({
    id: report.id,
    title: report.title || "",
    description: report.description || "",
    location: report.location || "",
    lat: report.lat ?? null,
    lng: report.lng ?? null,
    type:
      report.type === "red-flag"
        ? "Red Flag"
        : report.type === "intervention"
        ? "Intervention"
        : report.type || "pending",
    status: report.status || "pending",
    media: report.media || [],
    user_id: report.user_id || null,
  });

  return (
    <div className="space-y-3">
      {recent.map((report, idx) => (
        <div
          key={report?.id || idx}
          className="p-4 bg-white rounded shadow flex justify-between items-center border border-gray-200"
        >
          <div>
            <h4 className="font-semibold">
              {report?.title ?? "Untitled Report"}
            </h4>
            <p className="text-sm text-gray-600">
              {report?.description ?? "No description"}
            </p>
            <div className="mt-1 text-xs text-gray-400">
              Status:{" "}
              <select
                value={
                  STATUS_OPTIONS[report?.status] ? report.status : "pending"
                }
                onChange={(e) => {
                  if (onStatusUpdate) {
                    onStatusUpdate(
                      report.id,
                      e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      report.user_id || null
                    );
                  }
                }}
                className="text-xs rounded px-2 py-1 border"
              >
                {Object.entries(STATUS_OPTIONS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label.charAt(0).toUpperCase() +
                      label.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {report?.status === "pending" && onEditReport && (
            <button
              onClick={() => onEditReport(normalizeReport(report))}
              className="bg-teal-600 text-white px-3 py-1 rounded text-sm hover:bg-teal-700"
            >
              Edit
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default RecentReports;
