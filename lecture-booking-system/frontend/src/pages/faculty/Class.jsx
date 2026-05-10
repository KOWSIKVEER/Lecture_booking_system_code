import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const Class = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchClasses = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.get('/classes/faculty/my-classes', { params });
      setClasses(res.data.data);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, [statusFilter]);

  const openClass = async (cls) => {
    setSelectedClass(cls);
    try {
      const res = await api.get(`/classes/${cls._id}/students`);
      setStudents(res.data.data);
      // Initialize attendance state
      const init = {};
      res.data.data.forEach(b => { init[b.student?._id] = 'present'; });
      setAttendance(init);
    } catch {
      toast.error('Failed to load students');
    }
  };

  const handleStartClass = async (classId) => {
    try {
      await api.post(`/classes/${classId}/start`);
      toast.success('Class started!');
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start class');
    }
  };

  const handleEndClass = async (classId) => {
    try {
      await api.post(`/classes/${classId}/end`);
      toast.success('Class ended!');
      fetchClasses();
      setSelectedClass(null);
    } catch {
      toast.error('Failed to end class');
    }
  };

  const handleMarkAttendance = async () => {
    try {
      setMarkingAttendance(true);
      const attendanceList = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
      await api.post('/attendance/mark', { classId: selectedClass._id, attendanceList });
      toast.success('Attendance marked!');
    } catch {
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingAttendance(false);
    }
  };

  const isClassActive = (cls) => {
    const now = new Date();
    return new Date(cls.startTime) <= now && new Date(cls.endTime) >= now;
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ongoing: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select className="input max-w-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Classes</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No classes found.</div>
      ) : (
        <div className="space-y-3">
          {classes.map(cls => {
            const active = isClassActive(cls);
            return (
              <div key={cls._id} className={`card p-5 ${active ? 'ring-2 ring-green-500/30' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{cls.topic}</h3>
                      {active && <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse">🔴 Live</span>}
                      <span className={`badge ${statusColors[cls.status]}`}>{cls.status}</span>
                    </div>
                    <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">{cls.course?.name}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{new Date(cls.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>{cls.location}</span>
                      <span>{cls.bookedCount}/{cls.maxStudents} students</span>
                      <span>Min: {cls.minStudents}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openClass(cls)} className="btn-secondary text-xs py-1.5 px-3">View Students</button>
                    {cls.status === 'scheduled' && (
                      <button onClick={() => handleStartClass(cls._id)} className="btn-primary text-xs py-1.5 px-3">Start</button>
                    )}
                    {cls.status === 'ongoing' && (
                      <button onClick={() => handleEndClass(cls._id)} className="btn-danger text-xs py-1.5 px-3">End</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Class Detail Modal */}
      <Modal isOpen={!!selectedClass} onClose={() => setSelectedClass(null)} title={selectedClass?.topic || ''} size="lg">
        {selectedClass && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="card p-3 text-center">
                <p className="text-gray-500 dark:text-gray-400">Booked</p>
                <p className="text-xl font-bold text-primary-600">{selectedClass.bookedCount}</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-gray-500 dark:text-gray-400">Min Required</p>
                <p className="text-xl font-bold text-yellow-600">{selectedClass.minStudents}</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-gray-500 dark:text-gray-400">Max Allowed</p>
                <p className="text-xl font-bold text-green-600">{selectedClass.maxStudents}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Booked Students ({students.length})</h4>
              {students.length === 0 ? (
                <p className="text-gray-500 text-sm">No students booked yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {students.map(b => (
                    <div key={b._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{b.student?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{b.student?.rollNumber} · {b.student?.department}</p>
                      </div>
                      {(selectedClass.status === 'ongoing' || selectedClass.status === 'completed') && (
                        <select
                          value={attendance[b.student?._id] || 'present'}
                          onChange={e => setAttendance(prev => ({ ...prev, [b.student?._id]: e.target.value }))}
                          className="text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(selectedClass.status === 'ongoing' || selectedClass.status === 'completed') && students.length > 0 && (
              <div className="flex justify-end">
                <button onClick={handleMarkAttendance} disabled={markingAttendance} className="btn-primary">
                  {markingAttendance ? 'Marking...' : 'Mark Attendance'}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Class;
