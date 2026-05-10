import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Timetable = () => {
  const [timetables, setTimetables] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', entry: null });
  const [form, setForm] = useState({ faculty: '', course: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', location: '', academicYear: '2024-25' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [fRes, cRes] = await Promise.all([
          api.get('/admin/faculty'),
          api.get('/admin/courses')
        ]);
        setFaculty(fRes.data.data);
        setCourses(cRes.data.data);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (selectedFaculty) {
      api.get(`/timetable/faculty/${selectedFaculty}`)
        .then(res => setTimetables(res.data.data))
        .catch(() => toast.error('Failed to load timetable'));
    }
  }, [selectedFaculty]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (modal.mode === 'create') {
        await api.post('/timetable', form);
        toast.success('Entry created!');
      } else {
        await api.put(`/timetable/${modal.entry._id}`, form);
        toast.success('Entry updated!');
      }
      setModal({ open: false, mode: 'create', entry: null });
      if (selectedFaculty) {
        const res = await api.get(`/timetable/faculty/${selectedFaculty}`);
        setTimetables(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      toast.success('Entry deleted');
      setTimetables(prev => prev.filter(t => t._id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <select className="input max-w-xs" value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}>
          <option value="">Select Faculty...</option>
          {faculty.map(f => <option key={f._id} value={f._id}>{f.name} ({f.facultyId})</option>)}
        </select>
        <button onClick={() => { setForm({ faculty: selectedFaculty, course: '', dayOfWeek: 1, startTime: '09:00', endTime: '10:30', location: '', academicYear: '2024-25' }); setModal({ open: true, mode: 'create', entry: null }); }} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Entry
        </button>
      </div>

      {selectedFaculty && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Timetable for {faculty.find(f => f._id === selectedFaculty)?.name}
            </h3>
          </div>
          {timetables.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No timetable entries. Add one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {['Day', 'Course', 'Time', 'Location', 'Academic Year', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {timetables.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(t => (
                    <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-medium text-primary-600 dark:text-primary-400">{DAYS[t.dayOfWeek]}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{t.course?.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.startTime} - {t.endTime}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.location}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.academicYear}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => { setForm({ faculty: t.faculty, course: t.course?._id, dayOfWeek: t.dayOfWeek, startTime: t.startTime, endTime: t.endTime, location: t.location, academicYear: t.academicYear }); setModal({ open: true, mode: 'edit', entry: t }); }} className="text-primary-600 hover:text-primary-700 text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(t._id)} className="text-red-600 hover:text-red-700 text-xs font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedFaculty && (
        <div className="card p-12 text-center text-gray-500">
          Select a faculty member to view or manage their timetable.
        </div>
      )}

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'create', entry: null })} title={modal.mode === 'create' ? 'Add Timetable Entry' : 'Edit Entry'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Faculty</label>
              <select className="input" value={form.faculty} onChange={e => setForm({ ...form, faculty: e.target.value })}>
                <option value="">Select...</option>
                {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Course</label>
              <select className="input" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
                <option value="">Select...</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Day of Week</label>
              <select className="input" value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location</label>
              <input type="text" className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div>
              <label className="label">Academic Year</label>
              <input type="text" className="input" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} placeholder="e.g. 2024-25" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setModal({ open: false, mode: 'create', entry: null })}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.faculty || !form.course}>
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Timetable;
