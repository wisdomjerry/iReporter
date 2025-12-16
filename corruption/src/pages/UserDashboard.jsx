import React from "react";
import {
  CheckCircle,
  Flag,
  Zap,
  Search,
  XCircle,
  Clock,
} from "lucide-react";
import { useReports } from "../contexts/ReportContext";
import { useUsers } from "../contexts/UserContext";
import ReportStepper from "../components/ReportStepper";
import UserReportsView from "../components/UserReportsView";
import FirstLoginPopup from "../components/FirstLoginPopup";
import { useNotifications } from "../contexts/NotificationContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";

/* ───── STAT CARD ───── */
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    blue: "bg-blue-100 text-blue-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="relative bg-white border border-gray-100 rounded-xl p-8 shadow-md">
      <div className={`absolute top-4 right-4 p-2 rounded-full ${colorClasses[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-gray-500 text-sm">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );
};

/* ───── QUICK ACTIONS ───── */
const QuickActions = ({ openStepper, setType }) => {
  const navigate = useNavigate();

  const actions = [
    { label: "Add Red-Flag Record", icon: Flag, className: "bg-red-500 text-white", type: "Red Flag" },
    { label: "Add Intervention", icon: Zap, className: "bg-teal-500 text-white", type: "Intervention" },
    { label: "View All Reports", icon: CheckCircle, className: "bg-gray-100 text-gray-800", type: "view" },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() =>
              a.type === "view"
                ? navigate("/dashboard/reports")
                : (setType(a.type), openStepper())
            }
            className={`w-full py-3 rounded-lg ${a.className}`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ───── DASHBOARD ───── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useUsers();
  const { reports, updateReport, deleteReport } = useReports();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const [stats, setStats] = React.useState({});
  const [stepperOpen, setStepperOpen] = React.useState(false);
  const [defaultReportType, setDefaultReportType] = React.useState("");
  const [editingReport, setEditingReport] = React.useState(null);
  const [showFirstPopup, setShowFirstPopup] = React.useState(false);

  /* ✅ FIRST LOGIN POPUP LOGIC (FIXED) */
  React.useEffect(() => {
    if (!currentUser) return;

    if (
      Number(currentUser.firstLoginShown) === 0 &&
      reports.length === 0
    ) {
      setShowFirstPopup(true);
    }
  }, [currentUser, reports]);

  const markFirstLoginShown = async () => {
    await apiService.put(
      `/users/${currentUser.id}/first-login-shown`,
      { firstLoginShown: 1 }
    );

    setCurrentUser((prev) => ({
      ...prev,
      firstLoginShown: 1,
    }));
  };

  /* STATS */
  React.useEffect(() => {
    setStats({
      resolved: reports.filter((r) => r.status === "resolved").length,
      rejected: reports.filter((r) => r.status === "rejected").length,
      pending: reports.filter((r) => r.status === "pending").length,
      underInvestigation: reports.filter((r) =>
        ["under-investigation", "under investigation"].includes(r.status?.toLowerCase())
      ).length,
      redFlags: reports.filter((r) => r.type === "red-flag").length,
      interventions: reports.filter((r) => r.type === "intervention").length,
    });
  }, [reports]);

  return (
    <div className="bg-gray-50 min-h-screen p-4 pt-20">

      {/* ✅ FIRST LOGIN POPUP */}
      {showFirstPopup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <FirstLoginPopup
            onClose={() => setShowFirstPopup(false)}
            onAddReport={() => {
              setShowFirstPopup(false);
              setStepperOpen(true);
            }}
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, {currentUser?.firstName}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="green" />
        <StatCard title="Pending" value={stats.pending} icon={Clock} color="gray" />
        <StatCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserReportsView
            reports={reports}
            onDelete={deleteReport}
            onUpdate={updateReport}
            onEdit={(r) => {
              setEditingReport(r);
              setStepperOpen(true);
            }}
          />
        </div>

        <QuickActions
          openStepper={() => setStepperOpen(true)}
          setType={setDefaultReportType}
        />
      </div>

      {/* ✅ REPORT STEPPER */}
      {stepperOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center pt-20">
          <div className="bg-white p-6 rounded-lg w-full max-w-4xl">
            <ReportStepper
              defaultType={defaultReportType}
              editingReport={editingReport}
              onClose={() => {
                setStepperOpen(false);
                setEditingReport(null);
              }}
              onReportAdded={async () => {
                toast.success("Report added!");

                if (Number(currentUser.firstLoginShown) === 0) {
                  await markFirstLoginShown();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
