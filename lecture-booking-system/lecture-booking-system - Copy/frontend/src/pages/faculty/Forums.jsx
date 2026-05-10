import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';

const Forums = () => {
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForum, setSelectedForum] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '', isAnnouncement: false });

  const fetchForums = async () => {
    try {
      const res = await api.get('/forums');
      setForums(res.data.data);
    } catch {
      toast.error('Failed to load forums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForums(); }, []);

  const openForum = async (forum) => {
    try {
      const res = await api.get(`/forums/${forum._id}`);
      setSelectedForum(res.data.data);
      setReplies(res.data.data.replies || []);
    } catch {
      toast.error('Failed to load forum');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await api.post(`/forums/${selectedForum._id}/reply`, { content: replyText });
      setReplyText('');
      const res = await api.get(`/forums/${selectedForum._id}`);
      setReplies(res.data.data.replies || []);
      toast.success('Reply posted!');
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/forums', { ...newPost, tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean) });
      toast.success(newPost.isAnnouncement ? 'Announcement posted!' : 'Post created!');
      setCreateModal(false);
      setNewPost({ title: '', content: '', tags: '', isAnnouncement: false });
      fetchForums();
    } catch {
      toast.error('Failed to create post');
    }
  };

  const handleDelete = async (forumId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/forums/${forumId}`);
      toast.success('Post deleted');
      fetchForums();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Discussion Forums</h2>
        <button onClick={() => setCreateModal(true)} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {forums.map(forum => (
            <div key={forum._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => openForum(forum)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {forum.isPinned && <span className="badge bg-yellow-100 text-yellow-700 text-xs">📌 Pinned</span>}
                    {forum.isAnnouncement && <span className="badge bg-red-100 text-red-700 text-xs">📢 Announcement</span>}
                    <h3 className="font-semibold text-gray-900 dark:text-white">{forum.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{forum.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{forum.authorData?.name} · {forum.authorType}</span>
                    <span>💬 {forum.replyCount}</span>
                    <span>❤️ {forum.likeCount}</span>
                    <span>{new Date(forum.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(forum._id)} className="text-gray-400 hover:text-red-500 p-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forum Detail Modal */}
      <Modal isOpen={!!selectedForum} onClose={() => setSelectedForum(null)} title={selectedForum?.title || ''} size="lg">
        {selectedForum && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">{selectedForum.content}</p>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Replies ({replies.length})</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {replies.map(reply => (
                  <div key={reply._id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {reply.authorData?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{reply.authorData?.name} · {reply.authorType}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input type="text" className="input flex-1" placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReply()} />
              <button onClick={handleReply} className="btn-primary px-4">Reply</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Post Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create Post / Announcement">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <input type="checkbox" id="announcement" checked={newPost.isAnnouncement} onChange={e => setNewPost({ ...newPost, isAnnouncement: e.target.checked })} className="w-4 h-4 text-primary-600" />
            <label htmlFor="announcement" className="text-sm font-medium text-gray-700 dark:text-gray-300">Post as Announcement</label>
          </div>
          <div>
            <label className="label">Title</label>
            <input type="text" className="input" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input" rows={4} value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input type="text" className="input" value={newPost.tags} onChange={e => setNewPost({ ...newPost, tags: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate} disabled={!newPost.title || !newPost.content}>Post</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Forums;
