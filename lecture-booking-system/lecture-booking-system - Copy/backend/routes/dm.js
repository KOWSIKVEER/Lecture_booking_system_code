const express = require('express');
const router = express.Router();
const { authenticate, studentOnly, facultyOnly } = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  sendMessage,
  getFacultyList,
  getUnreadCount
} = require('../controllers/dmController');

// Get inbox (all conversations)
router.get('/conversations', authenticate, getConversations);

// Get messages in a specific conversation
router.get('/conversations/:conversationId', authenticate, getMessages);

// Send a message
router.post('/send', authenticate, sendMessage);

// Faculty list for students to pick who to DM
router.get('/faculty-list', authenticate, studentOnly, getFacultyList);

// Unread count badge
router.get('/unread-count', authenticate, getUnreadCount);

module.exports = router;
