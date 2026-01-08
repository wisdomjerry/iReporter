import React, { useMemo, useEffect } from "react";
import { useReports } from "../contexts/ReportContext";
import { useNotifications } from "../contexts/NotificationContext";
import {
  Flag,
  Zap,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Bell,
} from "lucide-react";
import toast from "react-hot-toast";

// --- Utility Functions ---
const normalizeStatus = (status) =>
  status?.toLowerCase().replace(/\s+/g, "-") || "pending";

const calculateMetrics = (reports) => {
  const counts = reports.reduce(
    (acc, report) => {
      const type = report.type?.toLowerCase() || "red-flag";
      const status = normalizeStatus(report.status);

      if (status === "pending") acc.pending++;
      if (status === "resolved") acc.resolved++;
      if (status === "rejected") acc.rejected++;
      if (status === "under-investigation") acc.underInvestigation++;

      if (type === "red-flag") acc.totalRedFlags++;
      if (type === "intervention") acc.interventions++;
      return acc;
    },
    {
      pending: 0,
      resolved: 0,
      rejected: 0,
      underInvestigation: 0,
      totalRedFlags: 0,
      interventions: 0,
    }
  );

  return {
    ...counts,
    pendingTrend: { value: "+15%", color: "text-green-500", icon: ArrowUp },
    resolvedTrend: { value: "+10%", color: "text-green-500", icon: ArrowUp },
    rejectedTrend: { value: "-5%", color: "text-red-500", icon: ArrowDown },
    totalRedFlagsTrend: { value: "+12%", color: "text-green-500", icon: ArrowUp },
    interventionsTrend: { value: "+8%", color: "text-green-500", icon: ArrowUp },
    underInvestigationTrend: {
      value: "3 new this week",
      color: "text-yellow-600",
      icon: Clock,
    },
  };
};

// --- KPI Card ---
const KPICard = ({ title, count, icon: Icon, color, trend }) => (
  <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col justify-between transition hover:shadow-lg hover:scale-[1.01] duration-150">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">{count}</p>
      </div>
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace("bg-", "text-")}`} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center mt-3 text-xs">
        {trend.icon && <trend.icon className={`w-3 h-3 mr-1 ${trend.color}`} />}
        <span className={`font-semibold ${trend.color} mr-1`}>{trend.value}</span>
        {title !== "Under Investigation" && (
          <span className="text-gray-400">from last month</span>
        )}
      </div>
    )}
  </div>
);

// --- Recent Reports ---
const RecentReports = ({ reports, handleStatusUpdate }) => {
  const statuses = ["pending", "under-investigation", "resolved", "rejected"];

  const getStatusStyle = (status) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "pending":
        return { bg: "bg-pink-100", text: "text-pink-700", ring: "focus:ring-pink-300" };
      case "resolved":
        return { bg: "bg-green-100", text: "text-green-700", ring: "focus:ring-green-300" };
      case "rejected":
        return { bg: "bg-red-100", text: "text-red-700", ring: "focus:ring-red-300" };
      case "under-investigation":
        return { bg: "bg-yellow-100", text: "text-yellow-700", ring: "focus:ring-yellow-300" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-700", ring: "focus:ring-gray-300" };
    }
  };

  const formatDate = (dateString) =>
    dateString
      ? new Date(dateString).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white p-6 rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-5">Recent Reports</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Title", "User", "Status", "Date"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {reports.slice(0, 5).map((report) => {
              const style = getStatusStyle(report.status);
              return (
                <tr key={report.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{report.title}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{report.userName || report.user?.name || "Unknown User"}</td>
                  <td className="px-4 py-4">
                    <select
                      value={normalizeStatus(report.status)}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        await handleStatusUpdate(report.id, newStatus);
                      }}
                      className={`text-xs font-semibold rounded-full px-3 py-1 border focus:outline-none focus:ring-2 ${style.bg} ${style.text} ${style.ring} shadow-sm cursor-pointer transition`}
                    >
                      {statuses.map((status) => {
                        const s = getStatusStyle(status);
                        return (
                          <option
                            key={status}
                            value={status}
                            className={`${s.bg} ${s.text}`}
                          >
                            {status.charAt(0).toUpperCase() +
                              status.slice(1).replace("-", " ")}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(report.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Reports</h2>
        <div className="space-y-4">
          {reports.slice(0, 5).map((report) => {
            const style = getStatusStyle(report.status);
            return (
              <div
                key={report.id}
                className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 space-y-2 transition hover:shadow-lg"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Title:</span>
                  <span className="text-gray-900">{report.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">User:</span>
                  <span className="text-gray-900">{report.userName || report.user?.name || "Unknown User"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Status:</span>
                  <select
                    value={normalizeStatus(report.status)}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      await handleStatusUpdate(report.id, newStatus);
                    }}
                    className={`text-xs font-semibold rounded-full px-3 py-1 border focus:outline-none focus:ring-2 ${style.bg} ${style.text} ${style.ring} shadow-sm cursor-pointer transition`}
                  >
                    {statuses.map((status) => {
                      const s = getStatusStyle(status);
                      return (
                        <option
                          key={status}
                          value={status}
                          className={`${s.bg} ${s.text}`}
                        >
                          {status.charAt(0).toUpperCase() +
                            status.slice(1).replace("-", " ")}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Date:</span>
                  <span className="text-gray-500">{formatDate(report.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Notifications Sidebar ---
const RecentNotifications = () => {
  const { notifications, markAsRead } = useNotifications();

  const handleClick = async (id) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-md border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Notifications</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-500 text-sm">No notifications yet.</p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {notifications.slice(0, 5).map((n, i) => (
            <div
              key={i}
              onClick={() => handleClick(n.id)}
              className={`flex items-start p-3 rounded-lg cursor-pointer transition ${
                n.is_read === 0 ? "bg-blue-50 border-l-4 border-blue-500" : "bg-gray-50"
              }`}
            >
              <Bell
                className={`w-5 h-5 mt-1 mr-3 ${
                  n.is_read === 0 ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <div>
                <p
                  className={`font-semibold text-sm ${
                    n.is_read === 0 ? "text-gray-800" : "text-gray-700"
                  }`}
                >
                  {n.title || "Notification"}
                </p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Admin Dashboard ---
const AdminDashboard = () => {
  const { reports, fetchDashboardData, currentUser, updateReportStatus } = useReports();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = useMemo(() => calculateMetrics(reports), [reports]);

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      const updated = await updateReportStatus(reportId, newStatus);
      if (!updated) return toast.error("Failed to update report status");

      await fetchDashboardData();
      toast.success(`Status updated to "${newStatus}"`);
      // Real-time notification is handled by backend
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Something went wrong updating status");
    }
  };

  const displayName = currentUser?.name?.split(" ")[0] || "Admin";

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden p-4 pt-20">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard Overview</h1>
      <p className="text-gray-600 mt-1 mb-6 sm:mb-8">
        Welcome back, {displayName} — here’s a quick summary of your reports.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <KPICard title="Pending" count={metrics.pending} icon={Clock} color="bg-pink-500" trend={metrics.pendingTrend} />
        <KPICard title="Resolved" count={metrics.resolved} icon={CheckCircle} color="bg-green-500" trend={metrics.resolvedTrend} />
        <KPICard title="Rejected" count={metrics.rejected} icon={XCircle} color="bg-red-500" trend={metrics.rejectedTrend} />
        <KPICard title="Total Red-Flags" count={metrics.totalRedFlags} icon={Flag} color="bg-red-500" trend={metrics.totalRedFlagsTrend} />
        <KPICard title="Interventions" count={metrics.interventions} icon={Zap} color="bg-blue-500" trend={metrics.interventionsTrend} />
        <KPICard title="Under Investigation" count={metrics.underInvestigation} icon={Search} color="bg-yellow-500" trend={metrics.underInvestigationTrend} />
      </div>

      {/* Reports + Notifications */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <RecentReports reports={reports} handleStatusUpdate={handleStatusUpdate} />
        </div>
        <div className="w-full lg:w-80">
          <RecentNotifications />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
