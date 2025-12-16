import React, { useState } from "react"; 
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  // 2. Introduce state for sidebar collapse
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Function to toggle the collapse state
  const toggleCollapse = () => {
      setIsCollapsed(prev => !prev);
  };

  // Dynamic class to control the desktop margin of the main content area
  const mainContentMarginClass = isCollapsed ? 'md:ml-20' : 'md:ml-64';

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* 3. Pass collapse state and toggle function to Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleCollapse={toggleCollapse} 
      />

      {/* Content area wrapper: Apply dynamic margin for desktop */}
      <div className={`flex-1 flex flex-col ${mainContentMarginClass} transition-[margin-left] duration-300`}>
        
        {/* 4. Pass collapse state to Header */}
        <Header 
          isSidebarCollapsed={isCollapsed}
          
        />

        {/* 5. Main content container: Remove mt-16 as content components handle spacing from fixed header */}
        <main className="flex-1 p-6 pt-20 md:pt-4"> 
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;