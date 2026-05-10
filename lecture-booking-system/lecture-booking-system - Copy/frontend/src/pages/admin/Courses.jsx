import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', course: null });
  const [form, setForm] = useState({ courseId: '', name: '', department: '', description: '', credits: 3, semester: 1, coordinator: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [cRes, fRes] = await Promise.all([
        api.get('/admin/courses', { params: { search } }),
        api.get('/admin/faculty')
      ]);
      setCourses(cRes.data.data);
      setFaculty(fRes.data.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (modal.mode === 'create') {
        await api.post('/admin/courses', form);
        toast.success('Course created!');
      } else {
        await api.put(`/admin/courses/${modal.course._id}`, form);
        toast.success('Course updated!');
      }
      setModal({ open: false, mode: 'create', course: null });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this course?')) return;
    try {
      await api.delete(`/admin/courses/${id}`);
      toast.success('Course deactivated');
      fetchData();
    } catch {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" className="input pl-9" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => { setForm({ courseId: '', name: '', department: '', description: '', credits: 3, semester: 1, coordinator: '' }); setModal({ open: true, mode: 'create', course: null }); }} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Course
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))
        ) : courses.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-12">No courses found.</p>
        ) : courses.map(c => (
          <div key={c._id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 text-xs">{c.courseId}</span>
                  <span className="text-xs text-gray-400">{c.credits} credits</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{c.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{c.department}</p>
                {c.coordinator && <p className="text-xs text-gray-400 mt-1">Coordinator: {c.coordinator.name}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setForm({ courseId: c.courseId, name: c.name, department: c.department, description: c.description || '', credits: c.credits, semester: c.semester, coordinator: c.coordinator?._id || '' }); setModal({ open: true, mode: 'edit', course: c }); }} className="text-primary-600 hover:text-primary-700 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:text-red-600 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'create', course: null })} title={modal.mode === 'create' ? 'Add Course' : 'Edit Course'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Course ID</label>
              <input type="text" className="input" value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} disabled={modal.mode === 'edit'} />
            </div>
            <div>
              <label className="label">Course Name</label>
              <input type="text" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Department</label>
              <input type="text" className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="label">Credits</label>
              <input type="number" className="input" value={form.credits} onChange={e => setForm({ ...form, credits: parseInt(e.target.value) })} min="1" max="6" />
            </div>
            <div>
              <label className="label">Semester</label>
              <input type="number" className="input" value={form.semester} onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })} min="1" max="10" />
            </div>
            <div>
              <label className="label">Coordinator</label>
              <select className="input" value={form.coordinator} onChange={e => setForm({ ...form, coordinator: e.target.value })}>
                <option value="">Select coordinator...</option>
                {faculty.filter(f => f.is_coordinator).map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setModal({ open: false, mode: 'create', course: null })}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.courseId}>
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Courses;
