import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { connectSocket } from '../../services/socket';
import toast from 'react-hot-toast';

// ─── Conversation List Item ───────────────────────────────────────────────────
const ConversationItem = ({ conv, isActive, onClick }) => {
  const student = conv.student;
  const unread = conv.facultyUnread || 0;

  return (
    <button
      onClick={() => onClick(conv)}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-600' : ''}`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold">
          {student?.name?.charAt(0)?.toUpperCase()}
        </div>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
          {student?.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student?.rollNumber} · {student?.department}</p>
        {conv.lastMessage && (
          <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
            {conv.lastMessage}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs text-gray-400">
          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
        </span>
        {unread > 0 && (
          <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unread}
          </span>
        )}
      </div>
    </button>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isMine }) => (
  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
    <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
      isMine
        ? 'bg-purple-600 text-white rounded-br-sm'
        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
    }`}>
      <p className="leading-relaxed">{msg.text}</p>
      <p className={`text-xs mt-1 ${isMine ? 'text-purple-200' : 'text-gray-400'} text-right`}>
        {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        {isMine && <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>}
      </p>
    </div>
  </div>
);

// ─── Main Faculty DM Page ─────────────────────────────────────────────────────
const DirectMessages = () => {
  const { user } = useSelector(state => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const activeConvRef = useRef(null);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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
    socketRef.current.emit('join:user', user._id);

    socketRef.current.on('dm:message', ({ conversationId, message }) => {
      if (activeConvRef.current?._id === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      fetchConversations();
    });

    socketRef.current.on('dm:notification', ({ from, preview, conversationId }) => {
      if (activeConvRef.current?._id !== conversationId) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-xs bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 flex items-start gap-3 border border-gray-200 dark:border-gray-700`}>
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
              {from?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">New doubt from student</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{from}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{preview}</p>
            </div>
          </div>
        ), { duration: 5000 });
      }
    });

    return () => {
      socketRef.current?.off('dm:message');
      socketRef.current?.off('dm:notification');
    };
  }, [user._id, fetchConversations]);

  const openConversation = async (conv) => {
    if (activeConv) socketRef.current?.emit('leave:dm', activeConv._id);
    setActiveConv(conv);
    setLoadingMsgs(true);

    try {
      const res = await api.get(`/dm/conversations/${conv._id}`);
      setMessages(res.data.data.messages || []);
      setConversations(prev => prev.map(c =>
        c._id === conv._id ? { ...c, facultyUnread: 0 } : c
      ));
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMsgs(false);
    }

    socketRef.current?.emit('join:dm', conv._id);
  };

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);

    try {
      const res = await api.post('/dm/send', {
        studentId: activeConv.student._id,
        text: text.trim()
      });
      setMessages(prev => [...prev, res.data.data.message]);
      setText('');
      fetchConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const totalUnread = conversations.reduce((s, c) => s + (c.facultyUnread || 0), 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 dark:text-white">Student Doubts</h2>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">{totalUnread}</span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Private messages from students</p>
        </div>

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
              <p className="text-sm text-gray-500 dark:text-gray-400">No student messages yet</p>
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv._id}
                conv={conv}
                isActive={activeConv?._id === conv._id}
                onClick={openConversation}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeConv ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-semibold flex-shrink-0">
              {activeConv.student?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{activeConv.student?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{activeConv.student?.rollNumber} · {activeConv.student?.department}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-400">Private</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50 dark:bg-gray-900/30">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <svg className="animate-spin w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet. Reply to the student's doubt.</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <MessageBubble key={msg._id || i} msg={msg} isMine={msg.senderType === 'Faculty'} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                placeholder={`Reply to ${activeConv.student?.name?.split(' ')[0]}...`}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
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
            <p className="text-xs text-gray-400 mt-1.5 ml-1">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50 dark:bg-gray-900/20">
          <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Student Doubt Inbox</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
            Students can privately message you with doubts. Select a conversation to reply.
          </p>
        </div>
      )}
    </div>
  );
};

export default DirectMessages;
