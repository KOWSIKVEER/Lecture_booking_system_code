import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState({ open: false, mode: 'create', faculty: null });
  const [form, setForm] = useState({ facultyId: '', name: '', email: '', password: '', department: '', designation: 'Assistant Professor', is_coordinator: false });
  const [saving, setSaving] = useState(false);

  const fetchFaculty = useCallback(async () => {
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      const res = await api.get('/admin/faculty', { params });
      setFaculty(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchFaculty(); }, [fetchFaculty]);

  const openCreate = () => {
    setForm({ facultyId: '', name: '', email: '', password: '', department: '', designation: 'Assistant Professor', is_coordinator: false });
    setModal({ open: true, mode: 'create', faculty: null });
  };

  const openEdit = (f) => {
    setForm({ facultyId: f.facultyId, name: f.name, email: f.email, password: '', department: f.department, designation: f.designation, is_coordinator: f.is_coordinator });
    setModal({ open: true, mode: 'edit', faculty: f });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (modal.mode === 'create') {
        await api.post('/admin/faculty', form);
        toast.success('Faculty created!');
      } else {
        const { password, ...data } = form;
        await api.put(`/admin/faculty/${modal.faculty._id}`, data);
        toast.success('Faculty updated!');
      }
      setModal({ open: false, mode: 'create', faculty: null });
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this faculty?')) return;
    try {
      await api.delete(`/admin/faculty/${id}`);
      toast.success('Faculty deactivated');
      fetchFaculty();
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
          <input type="text" className="input pl-9" placeholder="Search faculty..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Faculty
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Faculty', 'ID', 'Department', 'Designation', 'Coordinator', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>)}</tr>
                ))
              ) : faculty.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No faculty found.</td></tr>
              ) : faculty.map(f => (
                <tr key={f._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 text-sm font-semibold">
                        {f.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{f.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{f.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{f.facultyId}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{f.department}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{f.designation}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${f.is_coordinator ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {f.is_coordinator ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(f)} className="text-primary-600 hover:text-primary-700 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(f._id)} className="text-red-600 hover:text-red-700 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Showing {faculty.length} of {pagination.total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">Prev</button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-2 py-1.5">{page} / {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'create', faculty: null })} title={modal.mode === 'create' ? 'Add Faculty' : 'Edit Faculty'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Faculty ID</label>
              <input type="text" className="input" value={form.facultyId} onChange={e => setForm({ ...form, facultyId: e.target.value })} disabled={modal.mode === 'edit'} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            {modal.mode === 'create' && (
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            )}
            <div>
              <label className="label">Department</label>
              <input type="text" className="input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="label">Designation</label>
              <select className="input" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                <option>Assistant Professor</option>
                <option>Associate Professor</option>
                <option>Professor</option>
                <option>Lecturer</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <input type="checkbox" id="coordinator" checked={form.is_coordinator} onChange={e => setForm({ ...form, is_coordinator: e.target.checked })} className="w-4 h-4 text-primary-600" />
            <label htmlFor="coordinator" className="text-sm font-medium text-gray-700 dark:text-gray-300">Is Coordinator (can upload official notes & create assignments)</label>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setModal({ open: false, mode: 'create', faculty: null })}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.facultyId}>
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Faculty;
