import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week');
  const [scheduleModal, setScheduleModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    timetableId: '', topic: '', description: '', minStudents: 5, maxStudents: 60,
    date: new Date().toISOString().split('T')[0], time: '', location: ''
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/timetable/my-timetable');
        setTimetable(res.data.data);
      } catch {
        toast.error('Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleScheduleClass = async () => {
    try {
      await api.post('/timetable/schedule-class', scheduleForm);
      toast.success('Class scheduled!');
      setScheduleModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule class');
    }
  };

  const openScheduleModal = (entry) => {
    setSelectedEntry(entry);
    setScheduleForm(prev => ({
      ...prev,
      timetableId: entry._id,
      time: entry.startTime,
      location: entry.location,
      topic: `${entry.course?.name} - Regular Class`
    }));
    setScheduleModal(true);
  };

  const today = new Date().getDay();

  // Group timetable by day
  const byDay = {};
  timetable.forEach(entry => {
    if (!byDay[entry.dayOfWeek]) byDay[entry.dayOfWeek] = [];
    byDay[entry.dayOfWeek].push(entry);
  });

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {['week', 'day'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${view === v ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              {v}
            </button>
          ))}
        </div>
        <button onClick={() => setScheduleModal(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Schedule Class
        </button>
      </div>

      {loading ? (
        <div className="card p-8 animate-pulse">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                {Array.from({ length: 3 }).map((_, j) => <div key={j} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Week View */}
          {view === 'week' && (
            <div className="card overflow-hidden">
              <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                {DAYS.map((day, i) => (
                  <div key={day} className={`p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${i === today ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${i === today ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {day.substring(0, 3)}
                    </p>
                    {i === today && <div className="w-1.5 h-1.5 bg-primary-600 rounded-full mx-auto mt-1" />}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 min-h-64">
                {DAYS.map((day, i) => (
                  <div key={day} className={`p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 space-y-2 ${i === today ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                    {(byDay[i] || []).map(entry => (
                      <div
                        key={entry._id}
                        onClick={() => openScheduleModal(entry)}
                        className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                      >
                        <p className="text-xs font-semibold text-primary-800 dark:text-primary-300 truncate">{entry.course?.name}</p>
                        <p className="text-xs text-primary-600 dark:text-primary-400">{entry.startTime} - {entry.endTime}</p>
                        <p className="text-xs text-primary-500 dark:text-primary-500 truncate">{entry.location}</p>
                      </div>
                    ))}
                    {!byDay[i] && (
                      <p className="text-xs text-gray-300 dark:text-gray-600 text-center pt-4">Free</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day View */}
          {view === 'day' && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Today's Schedule ({DAYS[today]})</h3>
              {(byDay[today] || []).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No classes scheduled for today.</p>
              ) : (
                <div className="space-y-3">
                  {(byDay[today] || []).sort((a, b) => a.startTime.localeCompare(b.startTime)).map(entry => (
                    <div key={entry._id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="text-center min-w-16">
                        <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{entry.startTime}</p>
                        <p className="text-xs text-gray-400">{entry.endTime}</p>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">{entry.course?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{entry.location}</p>
                      </div>
                      <button onClick={() => openScheduleModal(entry)} className="btn-primary text-xs py-1.5 px-3">
                        Schedule
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Schedule Class Modal */}
      <Modal isOpen={scheduleModal} onClose={() => setScheduleModal(false)} title="Schedule Class" size="lg">
        <div className="space-y-4">
          {timetable.length > 0 && !selectedEntry && (
            <div>
              <label className="label">Select Timetable Entry</label>
              <select className="input" value={scheduleForm.timetableId} onChange={e => {
                const entry = timetable.find(t => t._id === e.target.value);
                if (entry) {
                  setScheduleForm(prev => ({ ...prev, timetableId: e.target.value, time: entry.startTime, location: entry.location, topic: `${entry.course?.name} - Regular Class` }));
                }
              }}>
                <option value="">Select...</option>
                {timetable.map(t => (
                  <option key={t._id} value={t._id}>{DAYS[t.dayOfWeek]} - {t.course?.name} ({t.startTime})</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Topic</label>
              <input type="text" className="input" value={scheduleForm.topic} onChange={e => setScheduleForm({ ...scheduleForm, topic: e.target.value })} />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={scheduleForm.date} onChange={e => setScheduleForm({ ...scheduleForm, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Time</label>
              <input type="time" className="input" value={scheduleForm.time} onChange={e => setScheduleForm({ ...scheduleForm, time: e.target.value })} />
            </div>
            <div>
              <label className="label">Location</label>
              <input type="text" className="input" value={scheduleForm.location} onChange={e => setScheduleForm({ ...scheduleForm, location: e.target.value })} />
            </div>
            <div>
              <label className="label">Min Students</label>
              <input type="number" className="input" value={scheduleForm.minStudents} onChange={e => setScheduleForm({ ...scheduleForm, minStudents: parseInt(e.target.value) })} />
            </div>
            <div>
              <label className="label">Max Students</label>
              <input type="number" className="input" value={scheduleForm.maxStudents} onChange={e => setScheduleForm({ ...scheduleForm, maxStudents: parseInt(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={scheduleForm.description} onChange={e => setScheduleForm({ ...scheduleForm, description: e.target.value })} placeholder="Class description..." />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setScheduleModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleScheduleClass} disabled={!scheduleForm.timetableId && !selectedEntry}>Schedule</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Timetable;
