import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { useSelector } from 'react-redux';

const Notes = () => {
  const { user } = useSelector(state => state.auth);
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', course: '', tags: '' });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [notesRes, coursesRes] = await Promise.all([
          api.get('/notes'),
          api.get('/admin/courses')
        ]);
        setNotes(notesRes.data.data);
        setCourses(coursesRes.data.data);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleUpload = async () => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('course', form.course);
      formData.append('tags', form.tags);
      files.forEach(f => formData.append('files', f));

      await api.post('/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Notes uploaded!');
      setUploadModal(false);
      setForm({ title: '', description: '', course: '', tags: '' });
      setFiles([]);
      const res = await api.get('/notes');
      setNotes(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      toast.success('Note deleted');
      setNotes(prev => prev.filter(n => n._id !== noteId));
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h2>
          {!user?.is_coordinator && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-0.5">
              ⚠️ Only coordinators can upload official notes
            </p>
          )}
        </div>
        <button onClick={() => setUploadModal(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Notes
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No notes uploaded yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <div key={note._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{note.title}</h3>
                    <span className={`badge flex-shrink-0 text-xs ${note.type === 'official' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {note.type}
                    </span>
                  </div>
                  <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">{note.course?.name}</p>
                </div>
                <button onClick={() => handleDelete(note._id)} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              {note.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{note.description}</p>}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>{note.files?.length || 0} file(s)</span>
                <span>📥 {note.downloadCount} downloads</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={uploadModal} onClose={() => setUploadModal(false)} title="Upload Notes">
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input type="text" className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title..." />
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
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input type="text" className="input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="e.g. python, basics" />
          </div>
          <div>
            <label className="label">Files</label>
            <input type="file" multiple className="input" onChange={e => setFiles(Array.from(e.target.files))} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" />
            <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, PPT, PPTX, TXT</p>
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setUploadModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleUpload} disabled={uploading || !form.title || !form.course}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Notes;
