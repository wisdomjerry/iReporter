import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUsers } from "../contexts/UserContext";

// FIX 1: Accept isCollapsed and toggleCollapse from the parent layout
const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const { currentUser, logout } = useUsers();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === "admin";
  const baseLink = isAdmin ? "/admin" : "/dashboard";

  // FIX 2: Keep mobile state local
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  // --- Styling Classes ---

  const inactiveLinkClass = "text-gray-700 hover:bg-gray-100";
  const activeLinkClass = "bg-indigo-50 text-indigo-700 font-semibold";
  // Added overflow-hidden to hide overflowing text during transition
  const navLinkBase = "flex items-center gap-3 p-3 rounded-xl transition overflow-hidden"; 

  // Class to control link text visibility (hidden on collapse)
  const textVisibilityClass = isCollapsed ? "hidden" : "inline";

  // NavItem component (unchanged)
  const NavItem = ({ to, label, Icon, exact = false }) => (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `${navLinkBase} ${isActive ? activeLinkClass : inactiveLinkClass} ${
          isCollapsed ? "justify-center" : ""
        }`
      }
      onClick={() => setMobileOpen(false)}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {/* FIX 4: Use a span with whitespace-nowrap and flex-1 min-w-0 to handle text wrapping/overflow */}
      <span className={`whitespace-nowrap ${isCollapsed ? 'hidden' : 'flex-1 min-w-0'}`}>{label}</span>
    </NavLink>
  );

  const SidebarContent = (
    // However, since mobile sidebar uses this content, we must keep it flexible or redefine the mobile sidebar div.
    <div
      className={`flex flex-col h-full bg-white text-gray-800 w-full`} 
    >
      {/* Logo/Header Area */}
      <div
        className={`flex items-center h-20 px-5 border-b border-gray-100 ${
          isCollapsed ? "justify-center" : ""
        } transition-all duration-300 overflow-hidden`}
      >
        {/* FIX 6: Use conditional rendering for the full logo/collapsed logo */}
        {isCollapsed ? (
          <h1 className="text-xl font-bold text-indigo-600">iR</h1>
        ) : (
          <h1
            className={`text-2xl font-bold pt-5 tracking-wide text-gray-800 whitespace-nowrap transition-opacity duration-300`}
          >
            iReporter
          </h1>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        className={`flex-1 p-4 space-y-2 mt-5 ${
          isCollapsed ? "items-center" : ""
        } transition-all duration-300 overflow-y-auto`}
      >
        {/* --- Navigation Items --- */}
        <NavItem
          to={baseLink}
          label={isAdmin ? "Admin Dashboard" : "Dashboard"}
          Icon={LayoutDashboard}
          exact={true}
        />
        <NavItem to={`${baseLink}/profile`} label="Profile" Icon={User} />
        <NavItem
          to={`${baseLink}/reports`}
          label="My Reports"
          Icon={FileText}
        />
        <NavItem
          to={`${baseLink}/notifications`}
          label="Notifications"
          Icon={Bell}
        />
      </nav>

      {/* Logout Area */}
      <div
        className={`p-4 border-t border-gray-100 ${
          isCollapsed ? "flex justify-center" : ""
        } transition-all duration-300`}
      >
        <button
          className={`flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 transition w-full ${
            isCollapsed ? "justify-center p-0" : ""
          }`}
          onClick={logout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className={`whitespace-nowrap ${isCollapsed ? 'hidden' : 'flex-1 min-w-0'}`}>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        // The main container relies on isCollapsed for width transition
        className={`hidden md:flex fixed top-0 left-0 h-full ${
          isCollapsed ? "w-20" : "w-64"
        } bg-white border-r border-gray-200 shadow-lg rounded-r-xl transition-[width] duration-300 z-40`}
      >
        {SidebarContent}

        {/* Toggle Button (The floating arrow) */}
        <button
          // This button must use the toggleCollapse function from the layout
          onClick={toggleCollapse} 
          className="absolute top-1/2 -right-3.5 transform -translate-y-1/2 p-2 bg-white border border-gray-300 rounded-full shadow-md z-50 hover:bg-gray-50 focus:outline-none hidden md:block"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </aside>

      {/* Mobile hamburger button (unchanged) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white text-gray-800 shadow-md border border-gray-200"
        onClick={toggleMobile}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile sidebar (unchanged, still uses fixed width) */}
      <div
        className={`fixed top-0 left-0 h-full pt-6 w-64 bg-white text-gray-800 transform transition-transform duration-300 z-40 shadow-xl rounded-r-xl
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:hidden`}
      >
        {SidebarContent}
      </div>

      {/* Mobile overlay (unchanged) */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={toggleMobile}
        ></div>
      )}
    </>
  );
};

export default Sidebar;