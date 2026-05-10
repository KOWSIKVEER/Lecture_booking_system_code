import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/common/Modal';
import { connectSocket } from '../../services/socket';
import { useSelector } from 'react-redux';

const ForumCard = ({ forum, onClick }) => (
  <div onClick={() => onClick(forum)} className="card p-5 hover:shadow-md transition-shadow cursor-pointer">
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm flex-shrink-0">
        {forum.authorData?.name?.charAt(0)?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {forum.isPinned && <span className="badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">📌 Pinned</span>}
          {forum.isAnnouncement && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">📢 Announcement</span>}
          <h3 className="font-semibold text-gray-900 dark:text-white">{forum.title}</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{forum.content}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          <span>{forum.authorData?.name} · {forum.authorType}</span>
          {forum.course && <span className="text-primary-500">{forum.course.name}</span>}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {forum.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {forum.replyCount}
          </span>
          <span>{new Date(forum.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  </div>
);

const Forums = () => {
  const { user } = useSelector(state => state.auth);
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedForum, setSelectedForum] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [createModal, setCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '' });
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = connectSocket();
    socketRef.current.on('forum:new', () => fetchForums());
    return () => socketRef.current?.off('forum:new');
  }, []);

  const fetchForums = async () => {
    try {
      const params = search ? { search } : {};
      const res = await api.get('/forums', { params });
      setForums(res.data.data);
    } catch {
      toast.error('Failed to load forums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchForums(); }, [search]);

  const openForum = async (forum) => {
    setSelectedForum(forum);
    try {
      const res = await api.get(`/forums/${forum._id}`);
      setSelectedForum(res.data.data);
      setReplies(res.data.data.replies || []);
      socketRef.current?.emit('join:forum', forum._id);
      socketRef.current?.on('forum:reply', () => {
        api.get(`/forums/${forum._id}`).then(r => setReplies(r.data.data.replies || []));
      });
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

  const handleLike = async (forumId) => {
    try {
      await api.post(`/forums/${forumId}/like`);
      fetchForums();
    } catch {
      toast.error('Failed to like');
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/forums', { ...newPost, tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean) });
      toast.success('Post created!');
      setCreateModal(false);
      setNewPost({ title: '', content: '', tags: '' });
      fetchForums();
    } catch {
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" className="input pl-9" placeholder="Search discussions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
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
              <div className="flex gap-3">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {forums.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">No discussions yet. Start one!</div>
          ) : forums.map(forum => (
            <ForumCard key={forum._id} forum={forum} onClick={openForum} />
          ))}
        </div>
      )}

      {/* Forum Detail Modal */}
      <Modal isOpen={!!selectedForum} onClose={() => { setSelectedForum(null); setReplies([]); }} title={selectedForum?.title || ''} size="lg">
        {selectedForum && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                {selectedForum.authorData?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{selectedForum.authorData?.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedForum.content}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => handleLike(selectedForum._id)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {selectedForum.likeCount} likes
              </button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Replies ({replies.length})</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {replies.map(reply => (
                  <div key={reply._id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-semibold flex-shrink-0">
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
              <input type="text" className="input flex-1" placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReply()} />
              <button onClick={handleReply} className="btn-primary px-4">Reply</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Post Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New Post">
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input type="text" className="input" placeholder="Post title..." value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input" rows={4} placeholder="What's on your mind?" value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input type="text" className="input" placeholder="e.g. python, help, exam" value={newPost.tags} onChange={e => setNewPost({ ...newPost, tags: e.target.value })} />
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
