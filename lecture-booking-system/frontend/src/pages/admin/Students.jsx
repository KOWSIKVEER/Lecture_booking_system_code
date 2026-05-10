import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [modal, setModal] = useState({ open: false, mode: 'create', student: null });
  const [form, setForm] = useState({ rollNumber: '', name: '', email: '', password: '', department: '', year: 1, semester: 1, gpa: 0 });
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      const res = await api.get('/admin/students', { params });
      setStudents(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openCreate = () => {
    setForm({ rollNumber: '', name: '', email: '', password: '', department: '', year: 1, semester: 1, gpa: 0 });
    setModal({ open: true, mode: 'create', student: null });
  };

  const openEdit = (student) => {
    setForm({ rollNumber: student.rollNumber, name: student.name, email: student.email, password: '', department: student.department, year: student.year, semester: student.semester, gpa: student.gpa });
    setModal({ open: true, mode: 'edit', student });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (modal.mode === 'create') {
        await api.post('/admin/students', form);
        toast.success('Student created!');
      } else {
        const { password, ...data } = form;
        await api.put(`/admin/students/${modal.student._id}`, data);
        toast.success('Student updated!');
      }
      setModal({ open: false, mode: 'create', student: null });
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this student?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deactivated');
      fetchStudents();
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
          <input type="text" className="input pl-9" placeholder="Search students..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                {['Student', 'Roll Number', 'Department', 'Year', 'GPA', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No students found.</td></tr>
              ) : students.map(s => (
                <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-sm font-semibold">
                        {s.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.rollNumber}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.department}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Year {s.year}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${s.gpa >= 8 ? 'text-green-600' : s.gpa >= 6 ? 'text-yellow-600' : 'text-red-600'}`}>{s.gpa?.toFixed(1)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-primary-600 hover:text-primary-700 text-xs font-medium">Edit</button>
                      <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:text-red-700 text-xs font-medium">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Showing {students.length} of {pagination.total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">Prev</button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-2 py-1.5">{page} / {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'create', student: null })} title={modal.mode === 'create' ? 'Add Student' : 'Edit Student'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Roll Number</label>
              <input type="text" className="input" value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} disabled={modal.mode === 'edit'} />
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
              <label className="label">Year</label>
              <input type="number" className="input" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} min="1" max="5" />
            </div>
            <div>
              <label className="label">Semester</label>
              <input type="number" className="input" value={form.semester} onChange={e => setForm({ ...form, semester: parseInt(e.target.value) })} min="1" max="10" />
            </div>
            <div>
              <label className="label">GPA</label>
              <input type="number" className="input" value={form.gpa} onChange={e => setForm({ ...form, gpa: parseFloat(e.target.value) })} min="0" max="10" step="0.1" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setModal({ open: false, mode: 'create', student: null })}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.rollNumber}>
              {saving ? 'Saving...' : modal.mode === 'create' ? 'Create' : 'Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;
