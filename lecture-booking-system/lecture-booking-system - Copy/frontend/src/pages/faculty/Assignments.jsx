import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { useSelector } from 'react-redux';

const Assignments = () => {
  const { user } = useSelector(state => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [submissionsModal, setSubmissionsModal] = useState({ open: false, assignment: null, submissions: [] });
  const [gradeModal, setGradeModal] = useState({ open: false, submission: null, marks: '', feedback: '' });
  const [form, setForm] = useState({ title: '', description: '', course: '', dueDate: '', totalMarks: 100 });
  const [files, setFiles] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [aRes, cRes] = await Promise.all([
          api.get('/assignments'),
          api.get('/admin/courses')
        ]);
        setAssignments(aRes.data.data);
        setCourses(cRes.data.data);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleCreate = async () => {
    try {
      setCreating(true);
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      files.forEach(f => formData.append('attachments', f));
      await api.post('/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Assignment created!');
      setCreateModal(false);
      setForm({ title: '', description: '', course: '', dueDate: '', totalMarks: 100 });
      setFiles([]);
      const res = await api.get('/assignments');
      setAssignments(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const openSubmissions = async (assignment) => {
    try {
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      setSubmissionsModal({ open: true, assignment, submissions: res.data.data });
    } catch {
      toast.error('Failed to load submissions');
    }
  };

  const handleGrade = async () => {
    try {
      await api.post(`/assignments/${submissionsModal.assignment._id}/grade/${gradeModal.submission._id}`, {
        marks: parseInt(gradeModal.marks),
        feedback: gradeModal.feedback
      });
      toast.success('Graded!');
      setGradeModal({ open: false, submission: null, marks: '', feedback: '' });
      openSubmissions(submissionsModal.assignment);
    } catch {
      toast.error('Failed to grade');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assignments</h2>
          {!user?.is_coordinator && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-0.5">⚠️ Only coordinators can create assignments</p>
          )}
        </div>
        {user?.is_coordinator && (
          <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Assignment
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No assignments yet.</div>
      ) : (
        <div className="space-y-3">
          {assignments.map(a => (
            <div key={a._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">{a.course?.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{a.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                    <span>Total: {a.totalMarks} marks</span>
                  </div>
                </div>
                <button onClick={() => openSubmissions(a)} className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0">
                  View Submissions
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Assignment">
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input type="text" className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Course</label>
            <select className="input" value={form.course} onChange={e => setForm({ ...form, course: e.target.value })}>
              <option value="">Select course...</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input type="datetime-local" className="input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Total Marks</label>
              <input type="number" className="input" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Attachments</label>
            <input type="file" multiple className="input" onChange={e => setFiles(Array.from(e.target.files))} />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={creating || !form.title || !form.course || !form.dueDate}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Submissions Modal */}
      <Modal isOpen={submissionsModal.open} onClose={() => setSubmissionsModal({ open: false, assignment: null, submissions: [] })} title={`Submissions - ${submissionsModal.assignment?.title}`} size="lg">
        <div className="space-y-3">
          {submissionsModal.submissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No submissions yet.</p>
          ) : submissionsModal.submissions.map(sub => (
            <div key={sub._id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{sub.student?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sub.student?.rollNumber}</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                  {sub.remarks && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"{sub.remarks}"</p>}
                  {sub.marks != null && (
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                      Marks: {sub.marks}/{submissionsModal.assignment?.totalMarks}
                    </p>
                  )}
                  {sub.feedback && <p className="text-xs text-gray-500 mt-1">Feedback: {sub.feedback}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge text-xs ${sub.status === 'graded' ? 'bg-green-100 text-green-700' : sub.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                    {sub.status}
                  </span>
                  {sub.status !== 'graded' && (
                    <button onClick={() => setGradeModal({ open: true, submission: sub, marks: '', feedback: '' })} className="btn-primary text-xs py-1 px-2">Grade</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Grade Modal */}
      <Modal isOpen={gradeModal.open} onClose={() => setGradeModal({ open: false, submission: null, marks: '', feedback: '' })} title="Grade Submission">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">Student: {gradeModal.submission?.student?.name}</p>
          <div>
            <label className="label">Marks (out of {submissionsModal.assignment?.totalMarks})</label>
            <input type="number" className="input" value={gradeModal.marks} onChange={e => setGradeModal({ ...gradeModal, marks: e.target.value })} min="0" max={submissionsModal.assignment?.totalMarks} />
          </div>
          <div>
            <label className="label">Feedback</label>
            <textarea className="input" rows={3} value={gradeModal.feedback} onChange={e => setGradeModal({ ...gradeModal, feedback: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setGradeModal({ open: false, submission: null, marks: '', feedback: '' })}>Cancel</button>
            <button className="btn-primary" onClick={handleGrade} disabled={!gradeModal.marks}>Submit Grade</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Assignments;
