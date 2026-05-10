import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './store/slices/authSlice';
import { fetchNotifications } from './store/slices/notificationSlice';

// Pages
import LoginPage from './pages/LoginPage';

// Student pages
import StudentLayout from './layouts/StudentLayout';
import StudentClasses from './pages/student/Classes';
import StudentAttendance from './pages/student/Attendance';
import StudentAssignments from './pages/student/Assignments';
import StudentNotes from './pages/student/Notes';
import StudentForums from './pages/student/Forums';
import StudentProfile from './pages/student/Profile';
import StudentDirectMessages from './pages/student/DirectMessages';

// Faculty pages
import FacultyLayout from './layouts/FacultyLayout';
import FacultyTimetable from './pages/faculty/Timetable';
import FacultyForums from './pages/faculty/Forums';
import FacultyProfile from './pages/faculty/Profile';
import FacultyDirectMessages from './pages/faculty/DirectMessages';
import FacultyNotes from './pages/faculty/Notes';
import FacultyAssignments from './pages/faculty/Assignments';
import FacultyClass from './pages/faculty/Class';

// Admin pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminFaculty from './pages/admin/Faculty';
import AdminCourses from './pages/admin/Courses';
import AdminClasses from './pages/admin/Classes';
import AdminTimetable from './pages/admin/Timetable';

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMe());
      dispatch(fetchNotifications());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '10px', fontFamily: 'Inter, sans-serif' }
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={
          isAuthenticated
            ? <Navigate to={user?.role === 'student' ? '/student/classes' : user?.role === 'admin' ? '/admin/dashboard' : '/faculty/timetable'} replace />
            : <LoginPage />
        } />

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="classes" replace />} />
          <Route path="classes" element={<StudentClasses />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="assignments" element={<StudentAssignments />} />
          <Route path="notes" element={<StudentNotes />} />
          <Route path="forums" element={<StudentForums />} />
          <Route path="messages" element={<StudentDirectMessages />} />
          <Route path="profile" element={<StudentProfile />} />
        </Route>

        {/* Faculty Routes */}
        <Route path="/faculty" element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <FacultyLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="timetable" replace />} />
          <Route path="timetable" element={<FacultyTimetable />} />
          <Route path="forums" element={<FacultyForums />} />
          <Route path="messages" element={<FacultyDirectMessages />} />
          <Route path="profile" element={<FacultyProfile />} />
          <Route path="notes" element={<FacultyNotes />} />
          <Route path="assignments" element={<FacultyAssignments />} />
          <Route path="class" element={<FacultyClass />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="faculty" element={<AdminFaculty />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="timetable" element={<AdminTimetable />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={
          isAuthenticated
            ? <Navigate to={user?.role === 'student' ? '/student/classes' : user?.role === 'admin' ? '/admin/dashboard' : '/faculty/timetable'} replace />
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
