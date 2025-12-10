import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle,
  Flag,
  Zap,
  Search,
  XCircle,
  Clock,
  X,
} from "lucide-react";
import { useReports } from "../contexts/ReportContext";
import { useUsers } from "../contexts/UserContext";
import { useNotifications } from "../contexts/NotificationContext";
import ReportStepper from "../components/ReportStepper";
import UserReportsView from "../components/UserReportsView";
import WelcomeModal from "../components/WelcomeModal";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// -----------------------------------------------------
// STAT CARD
// -----------------------------------------------------
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    blue: "bg-blue-100 text-blue-600",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="relative bg-white border border-gray-100 rounded-xl p-8 shadow-md hover:shadow-lg transition-all">
      <div
        className={`absolute top-4 right-4 p-2 rounded-full ${colors[color]} flex items-center justify-center`}
      >
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
    </div>
  );
};

// -----------------------------------------------------
// QUICK ACTION BUTTONS
// -----------------------------------------------------
const QuickActions = ({ openStepper, setDefaultType }) => {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Add Red-Flag Record",
      icon: Flag,
      className: "bg-red-500 hover:bg-red-700 text-white",
      type: "Red Flag",
    },
    {
      label: "Add Intervention",
      icon: Zap,
      className: "bg-teal-500 hover:bg-teal-700 text-white",
      type: "Intervention",
    },
    {
      label: "View All Reports",
      icon: CheckCircle,
      className: "bg-gray-100 hover:bg-gray-200 text-gray-800",
      type: "view",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>

      <div className="space-y-3">
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => {
              if (a.type === "view") return navigate("/dashboard/reports");
              setDefaultType(a.type);
              openStepper();
            }}
            className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition ${
              a.className
            } ${a.className.includes("bg-gray") ? "" : "shadow-md"}`}
          >
            <a.icon className="w-5 h-5" />
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------
// MAIN DASHBOARD
// -----------------------------------------------------
const Dashboard = () => {
  const { currentUser, markFirstLoginSeen } = useUsers();
  const { reports, updateReport, deleteReport } = useReports();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  const [stats, setStats] = useState({});
  const [stepperOpen, setStepperOpen] = useState(false);
  const [defaultReportType, setDefaultReportType] = useState("Red Flag");
  const [editingReport, setEditingReport] = useState(null);

  // FTUE (First Time User Experience) modal
  const [showFirstReportPrompt, setShowFirstReportPrompt] = useState(false);

  // -----------------------------------------------------
  // FIRST-TIME REPORTER CHECK
  // -----------------------------------------------------
  const isFirstTimeReporter = useCallback((user, reportsList) => {
    if (!user || !reportsList) return false;
    const noReports = reportsList.length === 0;
    const welcomeNotSeen = user.firstLoginShown === false;

    console.log(
      `[FTUE CHECK] Reports: ${reportsList.length}, FirstLoginShown: ${user.firstLoginShown}, ShouldShow: ${
        noReports && welcomeNotSeen
      }`
    );

    return noReports && welcomeNotSeen;
  }, []);

  // -----------------------------------------------------
  // EFFECT: SHOW OR HIDE FTUE MODAL
  // -----------------------------------------------------
  useEffect(() => {
    if (!currentUser || !reports) return;

    console.log(
      `[FTUE EFFECT] StepperOpen: ${stepperOpen}, ShowFirstReportPrompt: ${showFirstReportPrompt}`
    );

    if (stepperOpen) {
      console.log("[FTUE EFFECT] Stepper is open → Won't show WelcomeModal");
      return;
    }

    const shouldShow = isFirstTimeReporter(currentUser, reports);
    console.log(`[FTUE EFFECT] Should show WelcomeModal: ${shouldShow}`);

    setShowFirstReportPrompt(shouldShow);
  }, [currentUser, reports, stepperOpen, showFirstReportPrompt, isFirstTimeReporter]);

  // -----------------------------------------------------
  // EFFECT: CALCULATE DASHBOARD STATS
  // -----------------------------------------------------
  useEffect(() => {
    if (!reports) return;

    setStats({
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
    });
  }, [reports]);

  // -----------------------------------------------------
  // FTUE HANDLERS
  // -----------------------------------------------------
  const handleStartFirstReport = () => {
    console.log("[FTUE] User clicked 'Start First Report'");
    console.log("[FTUE] Closing WelcomeModal and opening Stepper");

    setShowFirstReportPrompt(false); // Close WelcomeModal
    setStepperOpen(true);            // Open Stepper
    setDefaultReportType("Red Flag");

    markFirstLoginSeen();
    console.log("[FTUE] First login flag saved, StepperOpen:", true);
  };

  const handleWelcomeClose = () => {
    console.log("[FTUE] User dismissed WelcomeModal");
    setShowFirstReportPrompt(false);
    markFirstLoginSeen();
  };

  // -----------------------------------------------------
  // STEPPER HANDLERS
  // -----------------------------------------------------
  const handleStepperClose = () => {
    console.log("[STEPPER] User closed the Stepper manually");
    setStepperOpen(false);
    setEditingReport(null);
  };

  const handleReportAdded = (newReport) => {
    console.log(`[STEPPER] Report "${newReport.title}" submitted`);
    toast.success(`Report "${newReport.title}" submitted successfully!`);
    handleStepperClose();
  };

  console.log(
    `[RENDER] ShowFirstReportPrompt: ${showFirstReportPrompt}, StepperOpen: ${stepperOpen}`
  );

  // -----------------------------------------------------
  // RENDER — FTUE MODAL
  // -----------------------------------------------------
  if (showFirstReportPrompt) {
    console.log("[RENDER] Displaying WelcomeModal");
    return (
      <WelcomeModal
        onStartReport={handleStartFirstReport}
        onClose={handleWelcomeClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-20">
      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {currentUser?.firstName}!
        </p>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {[
          { title: "Resolved Reports", value: stats.resolved, icon: CheckCircle, color: "green" },
          { title: "Pending Reports", value: stats.pending, icon: Clock, color: "gray" },
          { title: "Under Investigation", value: stats.underInvestigation, icon: Search, color: "yellow" },
          { title: "Rejected Reports", value: stats.rejected, icon: XCircle, color: "red" },
          { title: "Red-Flag Reports", value: stats.redFlags, icon: Flag, color: "red" },
          { title: "Interventions", value: stats.interventions, icon: Zap, color: "blue" },
        ].map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      {/* REPORTS + ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserReportsView
            reports={reports}
            role="user"
            setEditingReport={setEditingReport}
            setShowModal={setStepperOpen}
            onDelete={deleteReport}
            onEdit={(report) => {
              setEditingReport(report);
              setStepperOpen(true);
            }}
            onUpdate={updateReport}
            loading={false}
          />
        </div>

        <div className="space-y-6">
          <QuickActions
            openStepper={() => setStepperOpen(true)}
            setDefaultType={setDefaultReportType}
          />

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Recent Notifications
            </h2>

            {notifications.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.slice(0, 5).map((n) => (
                  <li
                    key={n.id}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      n.is_read === 0
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <p className="text-gray-700 text-sm">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No recent notifications</p>
            )}
          </div>
        </div>
      </div>

      {/* REPORT STEPPER MODAL */}
      {stepperOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mt-20 p-6 relative">
            <button
              onClick={handleStepperClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
            >
              <X className="w-6 h-6" />
            </button>

            <ReportStepper
              defaultType={defaultReportType}
              reportToEdit={editingReport}
              onClose={handleStepperClose}
              onReportAdded={handleReportAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
