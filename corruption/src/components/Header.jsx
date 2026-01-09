import React, { useState, useEffect, useRef } from "react";
import { Menu, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useUsers } from "../contexts/UserContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";

const Header = ({ isSidebarCollapsed, toggleMobileSidebar }) => {
  const { currentUser, logout } = useUsers();
  const { notifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const sidebarWidthClass = isSidebarCollapsed ? "md:left-20" : "md:left-64";

  // --- Close user menu on outside click ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Unread notifications count ---
  const unreadCount = (notifications || []).filter(
    (n) => n.is_read !== 1 && n.is_read !== true
  ).length;

  const user = currentUser || { email: "", role: "user", firstName: "User" };

  return (
    <header
      className={`fixed top-0 left-0 ${sidebarWidthClass} right-0 h-20 bg-white shadow-md flex items-center justify-between px-6 md:px-10 z-10 border-b border-gray-100 transition-[left] duration-300`}
    >
      {/* Left: Menu */}
      <div className="flex items-center gap-4 flex-1">
        <Menu
          className="w-6 h-6 text-gray-600 md:hidden cursor-pointer"
          onClick={toggleMobileSidebar}
        />
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-5 relative">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowUserMenu(false);
            }}
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[0.55rem] sm:text-xs flex items-center justify-center rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
          />
        </div>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => {
              setShowUserMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://placehold.co/40x40/505050/FFFFFF?text=U";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-teal-700 flex items-center justify-center">
                  {user.firstName ? user.firstName[0].toUpperCase() : "U"}
                </div>
              )}
            </div>

            <div className="px-1 py-3 text-left hidden sm:block">
              <p className="font-semibold text-gray-800">
                {user.firstName || "User"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-800" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="px-4 py-3 border-b">
                <p className="font-semibold text-gray-800">{user.firstName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <ul className="py-2">
                <li
                  onClick={() => {
                    if (user.role === "admin") navigate("/admin/profile");
                    else navigate("/dashboard/profile");
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <User className="w-4 h-4" /> Profile
                </li>

                <li
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
