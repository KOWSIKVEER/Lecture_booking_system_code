import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/students', label: 'Students', icon: 'students' },
  { path: '/admin/faculty', label: 'Faculty', icon: 'faculty' },
  { path: '/admin/courses', label: 'Courses', icon: 'courses' },
  { path: '/admin/classes', label: 'Classes', icon: 'classes' },
  { path: '/admin/timetable', label: 'Timetable', icon: 'timetable' }
];

const pageTitles = {
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/students': 'Manage Students',
  '/admin/faculty': 'Manage Faculty',
  '/admin/courses': 'Manage Courses',
  '/admin/classes': 'Manage Classes',
  '/admin/timetable': 'Assign Timetables'
};

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Admin Panel';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar navItems={navItems} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
