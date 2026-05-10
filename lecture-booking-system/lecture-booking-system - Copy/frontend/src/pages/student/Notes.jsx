import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../../components/common/Skeleton';
import Modal from '../../components/common/Modal';

const NoteCard = ({ note, onSummarize, onDownload }) => {
  const [summarizing, setSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const handleSummarize = async () => {
    setSummarizing(true);
    await onSummarize(note._id);
    setSummarizing(false);
    setShowSummary(true);
  };

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{note.title}</h3>
            {note.type === 'official' && (
              <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">Official</span>
            )}
          </div>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">{note.course?.name}</p>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-xs">{note.downloadCount}</span>
        </div>
      </div>

      {note.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{note.description}</p>
      )}

      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.map(tag => (
            <span key={tag} className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs">{tag}</span>
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-400">
        By {note.faculty?.name} · {new Date(note.createdAt).toLocaleDateString()}
      </div>

      {/* Summary panel */}
      {showSummary && note.summary && (
        <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">AI Summary</span>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{note.summary}</p>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button onClick={() => onDownload(note._id)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
        <button
          onClick={handleSummarize}
          disabled={summarizing}
          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {summarizing ? 'Summarizing...' : 'Summarize'}
        </button>
      </div>
    </div>
  );
};

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const params = {};
        if (search) params.search = search;
        if (courseFilter) params.course = courseFilter;
        const res = await api.get('/notes', { params });
        setNotes(res.data.data);
      } catch {
        toast.error('Failed to load notes');
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [search, courseFilter]);

  const handleSummarize = async (noteId) => {
    try {
      const res = await api.post(`/notes/${noteId}/summarize`);
      setNotes(prev => prev.map(n => n._id === noteId ? { ...n, summary: res.data.data.summary } : n));
      toast.success('Summary generated!');
    } catch {
      toast.error('Failed to generate summary');
    }
  };

  const handleDownload = async (noteId) => {
    try {
      const res = await api.get(`/notes/${noteId}/download`);
      toast.success('Download info retrieved. Files: ' + res.data.data.length);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" className="input pl-9" placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : notes.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-500">No notes found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <NoteCard key={note._id} note={note} onSummarize={handleSummarize} onDownload={handleDownload} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Notes;
