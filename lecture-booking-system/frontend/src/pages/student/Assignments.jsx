import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { SkeletonCard } from '../../components/common/Skeleton';

const statusConfig = {
  due: { label: 'Due', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  submitted: { label: 'Submitted', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  graded: { label: 'Graded', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  late: { label: 'Late', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  missed: { label: 'Missed', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
};

const AssignmentCard = ({ assignment, onSubmit }) => {
  const status = assignment.status || 'due';
  const cfg = statusConfig[status] || statusConfig.due;
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = dueDate < new Date() && status === 'due';

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">{assignment.title}</h3>
          <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">{assignment.course?.name}</p>
        </div>
        <span className={`badge flex-shrink-0 ${cfg.class}`}>{cfg.label}</span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{assignment.description}</p>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="space-y-1">
          <p className="text-gray-500 dark:text-gray-400">
            Faculty: <span className="text-gray-700 dark:text-gray-300">{assignment.faculty?.name}</span>
          </p>
          <p className={`${isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
            Due: <span className="font-medium">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </p>
        </div>
        <div className="text-right">
          {assignment.submission?.marks != null && (
            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {assignment.submission.marks}/{assignment.totalMarks}
            </p>
          )}
          {(status === 'due' || status === 'late') && (
            <button onClick={() => onSubmit(assignment)} className="btn-primary text-xs py-1.5 px-3 mt-1">
              Submit
            </button>
          )}
        </div>
      </div>

      {assignment.submission?.feedback && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Feedback</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{assignment.submission.feedback}</p>
        </div>
      )}
    </div>
  );
};

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('due');
  const [submitModal, setSubmitModal] = useState({ open: false, assignment: null });
  const [files, setFiles] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/assignments');
        setAssignments(res.data.data);
      } catch {
        toast.error('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('remarks', remarks);
      await api.post(`/assignments/${submitModal.assignment._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Assignment submitted!');
      setSubmitModal({ open: false, assignment: null });
      setFiles([]);
      setRemarks('');
      const res = await api.get('/assignments');
      setAssignments(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const due = assignments.filter(a => a.status === 'due');
  const completed = assignments.filter(a => ['submitted', 'graded', 'late'].includes(a.status));
  const missed = assignments.filter(a => a.status === 'missed');

  const tabs = [
    { id: 'due', label: 'Due', count: due.length, color: 'text-blue-600' },
    { id: 'completed', label: 'Completed', count: completed.length, color: 'text-green-600' },
    { id: 'missed', label: 'Missed', count: missed.length, color: 'text-red-600' }
  ];

  const currentList = activeTab === 'due' ? due : activeTab === 'completed' ? completed : missed;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map(tab => (
          <div key={tab.id} className="card p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(tab.id)}>
            <p className="text-sm text-gray-500 dark:text-gray-400">{tab.label}</p>
            <p className={`text-2xl font-bold mt-1 ${tab.color}`}>{tab.count}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : currentList.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No {activeTab} assignments.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {currentList.map(a => (
            <AssignmentCard key={a._id} assignment={a} onSubmit={(a) => setSubmitModal({ open: true, assignment: a })} />
          ))}
        </div>
      )}

      {/* Submit Modal */}
      <Modal isOpen={submitModal.open} onClose={() => setSubmitModal({ open: false, assignment: null })} title="Submit Assignment">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400 font-medium">{submitModal.assignment?.title}</p>
          <div>
            <label className="label">Upload Files</label>
            <input
              type="file"
              multiple
              className="input"
              onChange={e => setFiles(Array.from(e.target.files))}
              accept=".pdf,.doc,.docx,.txt,.zip"
            />
            <p className="text-xs text-gray-400 mt-1">Accepted: PDF, DOC, DOCX, TXT, ZIP</p>
          </div>
          <div>
            <label className="label">Remarks (optional)</label>
            <textarea className="input" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Any notes for your submission..." />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setSubmitModal({ open: false, assignment: null })}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting || files.length === 0}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Assignments;
