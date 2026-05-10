import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';

const navItems = [
  { path: '/student/classes', label: 'Classes', icon: 'classes' },
  { path: '/student/attendance', label: 'Attendance', icon: 'attendance' },
  { path: '/student/assignments', label: 'Assignments', icon: 'assignments' },
  { path: '/student/notes', label: 'Notes', icon: 'notes' },
  { path: '/student/forums', label: 'Forums', icon: 'forums' },
  { path: '/student/messages', label: 'Messages', icon: 'messages' },
  { path: '/student/profile', label: 'Profile', icon: 'profile' }
];

const pageTitles = {
  '/student/classes': 'Classes',
  '/student/attendance': 'Attendance',
  '/student/assignments': 'Assignments',
  '/student/notes': 'Notes',
  '/student/forums': 'Forums',
  '/student/messages': 'Private Messages',
  '/student/profile': 'Profile'
};

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Student Portal';

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

export default StudentLayout;
