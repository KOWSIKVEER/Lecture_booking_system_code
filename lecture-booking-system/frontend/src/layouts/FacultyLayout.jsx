import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';

const navItems = [
  { path: '/faculty/timetable', label: 'Timetable', icon: 'timetable' },
  { path: '/faculty/class', label: 'Class', icon: 'class' },
  { path: '/faculty/assignments', label: 'Assignments', icon: 'assignments' },
  { path: '/faculty/notes', label: 'Upload Notes', icon: 'notes' },
  { path: '/faculty/forums', label: 'Forums', icon: 'forums' },
  { path: '/faculty/messages', label: 'Messages', icon: 'messages' },
  { path: '/faculty/profile', label: 'Profile', icon: 'profile' }
];

const pageTitles = {
  '/faculty/timetable': 'Timetable',
  '/faculty/class': 'Class Management',
  '/faculty/assignments': 'Assignments',
  '/faculty/notes': 'Upload Notes',
  '/faculty/forums': 'Forums',
  '/faculty/messages': 'Student Messages',
  '/faculty/profile': 'Profile'
};

const FacultyLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Faculty Portal';

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

export default FacultyLayout;
