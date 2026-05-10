import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import toast from 'react-hot-toast';

// ─── Conversation List Item ───────────────────────────────────────────────────
const ConversationItem = ({ conv, isActive, onClick, currentUserId }) => {
  const other = conv.faculty;
  const unread = conv.studentUnread || 0;

  return (
    <button
      onClick={() => onClick(conv)}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-600' : ''}`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 font-semibold">
          {other?.name?.charAt(0)?.toUpperCase()}
        </div>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
          {other?.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{other?.designation} · {other?.department}</p>
        {conv.lastMessage && (
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
        )}
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">
        {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
      </span>
    </button>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isMine }) => (
  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
      isMine
        ? 'bg-primary-600 text-white rounded-br-sm'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
    }`}>
      <p className="leading-relaxed">{msg.text}</p>
      <p className={`text-xs mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'} text-right`}>
        {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        {isMine && (
          <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>
        )}
      </p>
    </div>
  </div>
);

// ─── New Conversation Modal ───────────────────────────────────────────────────
const NewDMModal = ({ onClose, onStart }) => {
  const [faculties, setFaculties] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dm/faculty-list')
      .then(res => setFaculties(res.data.data))
      .catch(() => toast.error('Failed to load faculty'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = faculties.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">New Message</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            placeholder="Search faculty by name or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">No faculty found.</p>
          ) : filtered.map(f => (
            <button
              key={f._id}
              onClick={() => onStart(f)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 font-semibold flex-shrink-0">
                {f.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{f.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{f.designation} · {f.department}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main DM Page ─────────────────────────────────────────────────────────────
const DirectMessages = () => {
  const { user } = useSelector(state => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activeConvRef = useRef(null);

  // Keep ref in sync for socket handler
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/dm/conversations');
      setConversations(res.data.data);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Socket setup
  useEffect(() => {
    socketRef.current = connectSocket();

    // Join personal room for incoming DM notifications
    socketRef.current.emit('join:user', user._id);

    // Real-time incoming message
    socketRef.current.on('dm:message', ({ conversationId, message }) => {
      if (activeConvRef.current?._id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      // Refresh conversation list to update preview + unread
      fetchConversations();
    });

    // Notification when a new DM arrives from someone not currently open
    socketRef.current.on('dm:notification', ({ from, preview, conversationId }) => {
      if (activeConvRef.current?._id !== conversationId) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-xs bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 flex items-start gap-3 border border-gray-200 dark:border-gray-700`}>
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 font-semibold text-sm flex-shrink-0">
              {from?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{from}</p>
              <p className="text-xs text-gray-500 dark:text-gray:400 mt-0.5 line-clamp-2">{preview}</p>
            </div>
          </div>
        ), { duration: 4000 });
      }
    });

    return () => {
      socketRef.current?.off('dm:message');
      socketRef.current?.off('dm:notification');
    };
  }, [user._id, fetchConversations]);

  // Open a conversation
  const openConversation = async (conv) => {
    // Leave previous DM room
    if (activeConv) {
      socketRef.current?.emit('leave:dm', activeConv._id);
    }

    setActiveConv(conv);
    setLoadingMsgs(true);

    try {
      const res = await api.get(`/dm/conversations/${conv._id}`);
      setMessages(res.data.data.messages || []);
      // Update unread to 0 locally
      setConversations(prev => prev.map(c =>
        c._id === conv._id ? { ...c, studentUnread: 0 } : c
      ));
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }

    // Join this conversation's socket room
    socketRef.current?.emit('join:dm', conv._id);
  };

  // Start a new DM with a faculty
  const startNewDM = async (faculty) => {
    setShowNewDM(false);

    // Check if conversation already exists
    const existing = conversations.find(c => c.faculty?._id === faculty._id);
    if (existing) {
      openConversation(existing);
      return;
    }

    // Send a blank opener — we'll just open the chat window
    // The conversation is created on first message send
    const tempConv = {
      _id: null,
      faculty,
      student: { _id: user._id, name: user.name },
      messages: [],
      studentUnread: 0,
      lastMessage: '',
      isNew: true
    };
    setActiveConv(tempConv);
    setMessages([]);
  };

  // Send message
  const handleSend = async () => {
    if (!text.trim() || sending) return;

    const isNew = activeConv?.isNew;
    setSending(true);

    try {
      const payload = {
        facultyId: activeConv.faculty._id,
        text: text.trim()
      };

      const res = await api.post('/dm/send', payload);
      const { conversationId, message } = res.data.data;

      // If this was a new conversation, update activeConv with real ID
      if (isNew) {
        const updatedConv = { ...activeConv, _id: conversationId, isNew: false };
        setActiveConv(updatedConv);
        socketRef.current?.emit('join:dm', conversationId);
      }

      setMessages(prev => [...prev, message]);
      setText('');
      fetchConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

      {/* ── Sidebar: Conversation List ── */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Messages</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Private doubts with faculty</p>
          </div>
          <button
            onClick={() => setShowNewDM(true)}
            className="w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center justify-center transition-colors"
            title="New message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
              <button onClick={() => setShowNewDM(true)} className="mt-3 text-xs text-primary-600 hover:underline">
                Message a faculty
              </button>
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv._id}
                conv={conv}
                isActive={activeConv?._id === conv._id}
                onClick={openConversation}
                currentUserId={user._id}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat Area ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-400 font-semibold flex-shrink-0">
              {activeConv.faculty?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{activeConv.faculty?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activeConv.faculty?.designation} · {activeConv.faculty?.department}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-400">Private</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-gray-50 dark:bg-gray-900/30">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <svg className="animate-spin w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">This is a private conversation</p>
                <p className="text-xs text-gray-400 mt-1">Only you and {activeConv.faculty?.name} can see these messages.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <MessageBubble
                  key={msg._id || i}
                  msg={msg}
                  isMine={msg.senderType === 'Student'}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm leading-relaxed"
                placeholder={`Ask ${activeConv.faculty?.name?.split(' ')[0]} a doubt...`}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              >
                {sending ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 ml-1">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-gray-900/20">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Private Doubt Chat</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
            Ask doubts privately to any faculty. Only you and the faculty can see the conversation.
          </p>
          <button
            onClick={() => setShowNewDM(true)}
            className="mt-5 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Start a Conversation
          </button>
        </div>
      )}

      {/* New DM Modal */}
      {showNewDM && (
        <NewDMModal
          onClose={() => setShowNewDM(false)}
          onStart={startNewDM}
        />
      )}
    </div>
  );
};

export default DirectMessages;
